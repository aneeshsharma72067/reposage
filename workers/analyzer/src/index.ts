import process from 'node:process';
import { Worker, type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { processAnalysisRun } from '../../../apps/api/src/modules/analysis/analysis.service';

interface AnalysisJobPayload {
  analysisRunId: string;
  eventId: string;
  repositoryId: string;
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
      await processAnalysisRun(analysisRunId);

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
