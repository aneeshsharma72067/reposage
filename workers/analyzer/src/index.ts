import process from 'node:process';
import { Worker, type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import {
  processAnalysisRun,
  type AdditionalAnalysisFindingContext,
} from '../../../apps/api/src/modules/analysis/analysis.service';
import type { RuleFinding } from '../../../apps/api/src/modules/analysis/rules/rule.types';
import { analyzeWithAI } from '../../../packages/ai/aiAnalyzer';
import type {
  AIFinding,
  AnalysisContext as AIAnalysisContext,
} from '../../../packages/ai/types';
import { compressDiff } from '../../../packages/shared/src/diffCompression';

interface AnalysisJobPayload {
  analysisRunId: string;
  eventId: string;
  repositoryId: string;
}

function normalizeAIFindingType(type: string): RuleFinding['type'] {
  const normalized = type.trim().toUpperCase();

  if (
    normalized === 'API_BREAK' ||
    normalized.includes('API') ||
    normalized.includes('CONTRACT')
  ) {
    return 'API_BREAK';
  }

  if (normalized === 'ARCH_VIOLATION' || normalized.includes('ARCH')) {
    return 'ARCH_VIOLATION';
  }

  return 'REFACTOR_SUGGESTION';
}

function normalizeAIFindingSeverity(
  severity: AIFinding['severity'],
): RuleFinding['severity'] {
  switch (severity) {
    case 'CRITICAL':
      return 'CRITICAL';
    case 'WARNING':
      return 'WARNING';
    case 'INFO':
    default:
      return 'INFO';
  }
}

function toRuleFinding(aiFinding: AIFinding): RuleFinding {
  return {
    type: normalizeAIFindingType(aiFinding.type),
    severity: normalizeAIFindingSeverity(aiFinding.severity),
    title: aiFinding.title,
    description: aiFinding.description,
    metadata: {
      source: 'GEMINI_AI',
      aiType: aiFinding.type,
      file: aiFinding.file ?? null,
    },
  };
}

async function collectAIFindings(
  context: AdditionalAnalysisFindingContext,
): Promise<RuleFinding[]> {
  const compressedFiles = compressDiff(
    context.files.map((file) => ({
      filename: file.filename,
      patch: file.patch ?? undefined,
      additions: file.additions,
      deletions: file.deletions,
    })),
  );

  if (compressedFiles.length === 0) {
    return [];
  }

  const aiContext: AIAnalysisContext = {
    repository: context.repositoryFullName,
    commitSha: context.commitSha,
    commitMessage: context.commitMessage,
    files: compressedFiles,
  };

  const aiFindings = await analyzeWithAI(aiContext);
  return aiFindings.map(toRuleFinding);
}

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('Missing required environment variable: REDIS_URL');
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

const redisConnectionOptions: ConnectionOptions = {
  host: connection.options.host,
  port: connection.options.port,
  db: connection.options.db,
  username: connection.options.username,
  password: connection.options.password,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
};

connection.on('error', (error) => {
  console.error(
    JSON.stringify({
      level: 'error',
      event: 'redis.error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }),
  );
});

const worker = new Worker<AnalysisJobPayload>(
  'analysis-jobs',
  async (job) => {
    const { analysisRunId } = job.data;

    console.log(
      JSON.stringify({
        level: 'info',
        message: 'Processing analysis job',
        jobId: job.id,
        analysisRunId,
      }),
    );

    try {
      await processAnalysisRun(analysisRunId, {
        collectAdditionalFindings: collectAIFindings,
      });

      console.log(
        JSON.stringify({
          level: 'info',
          message: 'Analysis job completed',
          jobId: job.id,
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'Analysis job failed',
          jobId: job.id,
          analysisRunId,
          attemptsMade: job.attemptsMade,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );

      throw error;
    }
  },
  {
    connection: redisConnectionOptions,
    concurrency: 5,
  },
);

worker.on('error', (error) => {
  console.error(
    JSON.stringify({
      level: 'error',
      event: 'worker.error',
      queue: 'analysis-jobs',
      error: error instanceof Error ? error.message : 'Unknown error',
    }),
  );
});

worker.on('failed', (job, error) => {
  console.error(
    JSON.stringify({
      level: 'error',
      message: 'Analysis job failed',
      jobId: job?.id ?? null,
      attemptsMade: job?.attemptsMade ?? null,
      analysisRunId: job?.data.analysisRunId ?? null,
      error: error.message,
    }),
  );
});

console.log(
  JSON.stringify({
    level: 'info',
    event: 'worker.started',
    queue: 'analysis-jobs',
  }),
);

let isShuttingDown = false;

async function shutdown(signal: 'SIGINT' | 'SIGTERM'): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(
    JSON.stringify({
      level: 'info',
      event: 'worker.shutdown.started',
      signal,
    }),
  );

  try {
    await worker.close();
    await connection.quit();

    console.log(
      JSON.stringify({
        level: 'info',
        event: 'worker.shutdown.completed',
        signal,
      }),
    );

    process.exit(0);
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'worker.shutdown.failed',
        signal,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    );

    process.exit(1);
  }
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
