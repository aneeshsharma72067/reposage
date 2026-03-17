import type { FastifyBaseLogger } from 'fastify';
import {
  AnalysisStatus,
  EventType,
  Prisma,
  RepositoryStatus,
  SeverityLevel,
} from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { analysisQueue } from '../../lib/queue.js';
import { AppError } from '../../utils/errors.js';
import { generateInstallationAccessToken } from '../githubApp/githubApp.service.js';
import { analysisRules } from './rules/index.js';
import type { AnalysisContext, RuleFinding } from './rules/rule.types.js';
import type {
  AnalysisRunDetail,
  AnalysisFindingListItem,
  AnalysisRunListItem,
  GitHubPushPayload,
} from './analysis.types.js';

interface TriggerAnalysisInput {
  payload: GitHubPushPayload;
  logger: FastifyBaseLogger;
}

interface PushEventContext {
  sha: string;
  owner: string;
  repositoryName: string;
}

interface AnalysisExecutionContext {
  analysisRunId: string;
  repositoryId: string;
  installationId: bigint;
  pushEvent: PushEventContext;
}

interface CommitFileData {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string | null;
}

export interface AdditionalAnalysisFindingContext {
  analysisRunId: string;
  repositoryId: string;
  repositoryFullName: string;
  commitSha: string;
  commitMessage: string;
  files: CommitFileData[];
}

export interface ProcessAnalysisRunOptions {
  collectAdditionalFindings?: (
    context: AdditionalAnalysisFindingContext,
  ) => Promise<RuleFinding[]>;
}

interface CommitAnalysisInput {
  sha: string;
  message: string;
  files: CommitFileData[];
  additions: number;
  deletions: number;
}

interface GithubCommitResponseFile {
  filename?: string;
  additions?: number;
  deletions?: number;
  changes?: number;
  patch?: string;
}

interface GithubCommitResponse {
  sha?: string;
  commit?: {
    message?: string;
  };
  files?: GithubCommitResponseFile[];
  message?: string;
}

type FindingDraft = RuleFinding;

function isJsonObject(
  value: Prisma.JsonValue | undefined,
): value is Prisma.JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getJsonString(
  payload: Prisma.JsonObject,
  key: string,
): string | undefined {
  const value = payload[key];

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseRepositoryFullName(repoFullName: string): {
  owner: string;
  repositoryName: string;
} {
  const parts = repoFullName.split('/');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Invalid repository full name in event payload');
  }

  return {
    owner: parts[0],
    repositoryName: parts[1],
  };
}

function extractPushEventContext(payload: Prisma.JsonValue): PushEventContext {
  if (!isJsonObject(payload)) {
    throw new Error('Event payload is not a JSON object');
  }

  const sha = getJsonString(payload, 'after');

  if (!sha) {
    throw new Error('Missing commit SHA in push event payload');
  }

  const repoFullNameFromTopLevel = getJsonString(payload, 'repoFullName');

  if (repoFullNameFromTopLevel) {
    const { owner, repositoryName } = parseRepositoryFullName(
      repoFullNameFromTopLevel,
    );

    return {
      sha,
      owner,
      repositoryName,
    };
  }

  const repositoryValue = payload.repository;

  if (!isJsonObject(repositoryValue)) {
    throw new Error('Missing repository data in push event payload');
  }

  const repoFullNameFromNested = getJsonString(repositoryValue, 'full_name');

  if (repoFullNameFromNested) {
    const { owner, repositoryName } = parseRepositoryFullName(
      repoFullNameFromNested,
    );

    return {
      sha,
      owner,
      repositoryName,
    };
  }

  const repositoryName = getJsonString(repositoryValue, 'name');
  const ownerValue = repositoryValue.owner;

  if (!repositoryName || !isJsonObject(ownerValue)) {
    throw new Error('Missing repository owner/name in push event payload');
  }

  const owner = getJsonString(ownerValue, 'login');

  if (!owner) {
    throw new Error('Missing repository owner in push event payload');
  }

  return {
    sha,
    owner,
    repositoryName,
  };
}

async function loadAnalysisExecutionContext(
  analysisRunId: string,
): Promise<AnalysisExecutionContext> {
  const run = await prisma.analysisRun.findUnique({
    where: { id: analysisRunId },
    select: {
      id: true,
      event: {
        select: {
          payload: true,
          repository: {
            select: {
              id: true,
              installation: {
                select: {
                  installationId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!run) {
    throw new Error(`Analysis run not found: ${analysisRunId}`);
  }

  return {
    analysisRunId: run.id,
    repositoryId: run.event.repository.id,
    installationId: run.event.repository.installation.installationId,
    pushEvent: extractPushEventContext(run.event.payload),
  };
}

async function fetchCommitDataFromGithub(params: {
  owner: string;
  repositoryName: string;
  sha: string;
  installationToken: string;
}): Promise<CommitAnalysisInput> {
  const response = await fetch(
    `https://api.github.com/repos/${params.owner}/${params.repositoryName}/commits/${params.sha}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.installationToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  let responseBody: GithubCommitResponse | undefined;

  try {
    responseBody = (await response.json()) as GithubCommitResponse;
  } catch {
    responseBody = undefined;
  }

  if (!response.ok) {
    const githubMessage = responseBody?.message ?? 'Unknown GitHub API error';

    throw new Error(
      `Failed to fetch commit ${params.sha} (${response.status}): ${githubMessage}`,
    );
  }

  const files = (responseBody?.files ?? [])
    .filter((file): file is GithubCommitResponseFile => {
      return (
        typeof file.filename === 'string' && file.filename.trim().length > 0
      );
    })
    .map(
      (file): CommitFileData => ({
        filename: file.filename as string,
        additions: typeof file.additions === 'number' ? file.additions : 0,
        deletions: typeof file.deletions === 'number' ? file.deletions : 0,
        changes: typeof file.changes === 'number' ? file.changes : 0,
        patch: typeof file.patch === 'string' ? file.patch : null,
      }),
    );

  const additions = files.reduce((sum, file) => sum + file.additions, 0);
  const deletions = files.reduce((sum, file) => sum + file.deletions, 0);

  return {
    sha: typeof responseBody?.sha === 'string' ? responseBody.sha : params.sha,
    message:
      typeof responseBody?.commit?.message === 'string' &&
      responseBody.commit.message.trim().length > 0
        ? responseBody.commit.message
        : 'No commit message provided',
    files,
    additions,
    deletions,
  };
}

function buildAnalysisContext(
  executionContext: AnalysisExecutionContext,
  commitData: CommitAnalysisInput,
): AnalysisContext {
  return {
    repository: {
      id: executionContext.repositoryId,
      fullName: `${executionContext.pushEvent.owner}/${executionContext.pushEvent.repositoryName}`,
      owner: executionContext.pushEvent.owner,
      name: executionContext.pushEvent.repositoryName,
    },
    commitSha: commitData.sha,
    commitMessage: commitData.message,
    files: commitData.files,
    additions: commitData.additions,
    deletions: commitData.deletions,
    changedFilesCount: commitData.files.length,
  };
}

async function runAnalysisRules(
  analysisRunId: string,
  context: AnalysisContext,
): Promise<FindingDraft[]> {
  const results = await Promise.allSettled(
    analysisRules.map((rule) => rule.run(context)),
  );

  const findings: FindingDraft[] = [];

  for (const [index, result] of results.entries()) {
    const rule = analysisRules[index];

    if (result.status === 'fulfilled') {
      findings.push(...result.value);
      continue;
    }

    const errorMessage =
      result.reason instanceof Error
        ? result.reason.message
        : 'Unknown rule execution error';

    console.error('analysis rule execution failed', {
      analysisRunId,
      ruleId: rule?.id ?? 'unknown',
      error: errorMessage,
    });
  }

  return findings;
}

function resolveRepositoryHealth(findings: FindingDraft[]): RepositoryStatus {
  if (findings.some((finding) => finding.severity === SeverityLevel.CRITICAL)) {
    return RepositoryStatus.ISSUES_FOUND;
  }

  return RepositoryStatus.HEALTHY;
}

async function transitionAnalysisRunToRunning(
  tx: Prisma.TransactionClient,
  analysisRunId: string,
  repositoryId: string,
): Promise<void> {
  const startedAt = new Date();

  const updatedRun = await tx.analysisRun.updateMany({
    where: {
      id: analysisRunId,
      status: {
        in: [AnalysisStatus.PENDING, AnalysisStatus.FAILED],
      },
    },
    data: {
      status: AnalysisStatus.RUNNING,
      startedAt,
      completedAt: null,
      errorMessage: null,
    },
  });

  if (updatedRun.count !== 1) {
    throw new Error(
      'Invalid lifecycle transition: expected PENDING analysis run',
    );
  }

  await tx.repository.update({
    where: { id: repositoryId },
    data: { status: RepositoryStatus.ANALYZING },
  });
}

async function transitionAnalysisRunToCompleted(
  tx: Prisma.TransactionClient,
  analysisRunId: string,
  repositoryId: string,
  findings: FindingDraft[],
): Promise<void> {
  const completedAt = new Date();

  const updatedRun = await tx.analysisRun.updateMany({
    where: {
      id: analysisRunId,
      status: AnalysisStatus.RUNNING,
      startedAt: { not: null },
      completedAt: null,
    },
    data: {
      status: AnalysisStatus.COMPLETED,
      completedAt,
      errorMessage: null,
    },
  });

  if (updatedRun.count !== 1) {
    throw new Error(
      'Invalid lifecycle transition: expected RUNNING analysis run',
    );
  }

  if (findings.length > 0) {
    await tx.finding.createMany({
      data: findings.map((finding) => ({
        analysisRunId,
        repositoryId,
        type: finding.type,
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        metadata: finding.metadata,
      })),
    });
  }

  const repositoryHealth = resolveRepositoryHealth(findings);

  await tx.repository.update({
    where: { id: repositoryId },
    data: { status: repositoryHealth },
  });
}

async function transitionAnalysisRunToFailed(
  tx: Prisma.TransactionClient,
  analysisRunId: string,
  repositoryId: string,
  errorMessage: string,
): Promise<void> {
  const completedAt = new Date();

  const updatedRun = await tx.analysisRun.updateMany({
    where: {
      id: analysisRunId,
      status: AnalysisStatus.RUNNING,
      startedAt: { not: null },
      completedAt: null,
    },
    data: {
      status: AnalysisStatus.FAILED,
      completedAt,
      errorMessage,
    },
  });

  if (updatedRun.count !== 1) {
    throw new Error(
      'Invalid lifecycle transition: expected RUNNING analysis run',
    );
  }

  await tx.repository.update({
    where: { id: repositoryId },
    data: { status: RepositoryStatus.IDLE },
  });
}

export async function processAnalysisRun(
  analysisRunId: string,
  options?: ProcessAnalysisRunOptions,
): Promise<void> {
  const context = await loadAnalysisExecutionContext(analysisRunId);

  try {
    await prisma.$transaction(async (tx) => {
      await transitionAnalysisRunToRunning(
        tx,
        context.analysisRunId,
        context.repositoryId,
      );
    });

    const installationToken = await generateInstallationAccessToken(
      context.installationId,
    );

    const commitData = await fetchCommitDataFromGithub({
      owner: context.pushEvent.owner,
      repositoryName: context.pushEvent.repositoryName,
      sha: context.pushEvent.sha,
      installationToken,
    });

    console.log('fetched commit data', {
      analysisRunId: context.analysisRunId,
      commitData,
    });

    const analysisContext = buildAnalysisContext(context, commitData);
    const ruleFindings = await runAnalysisRules(
      context.analysisRunId,
      analysisContext,
    );

    let additionalFindings: FindingDraft[] = [];
    console.debug('options for additional findings collection', options);
    if (options?.collectAdditionalFindings) {
      try {
        console.debug('collecting additional findings', {
          analysisRunId: context.analysisRunId,
        });
        additionalFindings = await options.collectAdditionalFindings({
          analysisRunId: context.analysisRunId,
          repositoryId: context.repositoryId,
          repositoryFullName: `${context.pushEvent.owner}/${context.pushEvent.repositoryName}`,
          commitSha: commitData.sha,
          commitMessage: commitData.message,
          files: commitData.files,
        });
      } catch (error) {
        console.error('additional analysis findings collection failed', {
          analysisRunId: context.analysisRunId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const findings = [...ruleFindings, ...additionalFindings];

    console.log('calculated findings', {
      analysisRunId: context.analysisRunId,
      findings,
    });
    await prisma.$transaction(async (tx) => {
      await transitionAnalysisRunToCompleted(
        tx,
        context.analysisRunId,
        context.repositoryId,
        findings,
      );
    });
  } catch (error) {
    const lifecycleErrorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error during analysis processing';

    try {
      await prisma.$transaction(async (tx) => {
        await transitionAnalysisRunToFailed(
          tx,
          context.analysisRunId,
          context.repositoryId,
          lifecycleErrorMessage,
        );
      });
    } catch {}

    throw error;
  }
}

export async function triggerAnalysisFromPushEvent({
  payload,
  logger,
}: TriggerAnalysisInput): Promise<void> {
  const githubRepoId = payload.repository?.id;

  if (typeof githubRepoId !== 'number') {
    logger.warn(
      { event: 'analysis.push.skipped', reason: 'missing_repo_id' },
      'Push webhook missing repository ID, skipping analysis',
    );
    return;
  }

  const repository = await prisma.repository.findUnique({
    where: { githubRepoId: BigInt(githubRepoId) },
    select: { id: true, fullName: true },
  });

  if (!repository) {
    logger.info(
      {
        event: 'analysis.push.skipped',
        githubRepoId,
        reason: 'repo_not_found',
      },
      'Repository not tracked, skipping analysis',
    );
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        repositoryId: repository.id,
        type: EventType.PUSH,
        githubEventId: payload.after ?? null,
        payload: {
          ref: payload.ref ?? null,
          after: payload.after ?? null,
          pusherName: payload.pusher?.name ?? null,
          repoFullName: payload.repository?.full_name ?? null,
        },
        processed: false,
      },
    });

    const analysisRun = await tx.analysisRun.create({
      data: {
        eventId: event.id,
        status: AnalysisStatus.PENDING,
        startedAt: null,
        completedAt: null,
      },
    });

    await tx.event.update({
      where: { id: event.id },
      data: { processed: true },
    });

    await tx.repository.update({
      where: { id: repository.id },
      data: { status: RepositoryStatus.ANALYZING },
    });

    return { eventId: event.id, analysisRunId: analysisRun.id };
  });

  try {
    await analysisQueue.add(
      'process-analysis',
      {
        analysisRunId: result.analysisRunId,
        eventId: result.eventId,
        repositoryId: repository.id,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );
  } catch (error) {
    logger.error(
      {
        event: 'analysis.queue.publish_failed',
        analysisRunId: result.analysisRunId,
        eventId: result.eventId,
        repositoryId: repository.id,
        err: error,
      },
      'Failed to publish analysis job to queue',
    );
  }

  logger.info(
    {
      event: 'analysis.push.triggered',
      repositoryId: repository.id,
      repositoryFullName: repository.fullName,
      analysisRunId: result.analysisRunId,
      eventId: result.eventId,
      eventType: 'push',
      queueName: 'analysis-jobs',
      jobName: 'process-analysis',
    },
    'Analysis run created and published to queue from push event',
  );
}

export async function listAnalysisRunsForRepository(
  repositoryId: string,
  userId: string,
): Promise<AnalysisRunListItem[]> {
  const repository = await prisma.repository.findFirst({
    where: {
      id: repositoryId,
      installation: {
        installedByUserId: userId,
      },
    },
    select: { id: true },
  });

  if (!repository) {
    return [];
  }

  const runs = await prisma.analysisRun.findMany({
    where: {
      event: {
        repositoryId: repository.id,
      },
    },
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
      errorMessage: true,
      event: {
        select: {
          id: true,
          type: true,
          githubEventId: true,
          createdAt: true,
        },
      },
    },
  });

  return runs.map((run) => ({
    id: run.id,
    status: run.status,
    startedAt: run.startedAt?.toISOString() ?? null,
    completedAt: run.completedAt?.toISOString() ?? null,
    errorMessage: run.errorMessage,
    event: {
      id: run.event.id,
      type: run.event.type,
      githubEventId: run.event.githubEventId,
      createdAt: run.event.createdAt.toISOString(),
    },
  }));
}

export async function listFindingsForRepository(
  repositoryId: string,
  userId: string,
): Promise<AnalysisFindingListItem[]> {
  const repository = await prisma.repository.findFirst({
    where: {
      id: repositoryId,
      installation: {
        installedByUserId: userId,
      },
    },
    select: { id: true },
  });

  if (!repository) {
    return [];
  }

  const findings = await prisma.finding.findMany({
    where: {
      repositoryId: repository.id,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      type: true,
      severity: true,
      title: true,
      description: true,
      metadata: true,
      createdAt: true,
      analysisRun: {
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
        },
      },
    },
  });

  return findings.map((finding) => ({
    id: finding.id,
    type: finding.type,
    severity: finding.severity,
    title: finding.title,
    description: finding.description,
    metadata: finding.metadata,
    createdAt: finding.createdAt.toISOString(),
    analysisRun: {
      id: finding.analysisRun.id,
      status: finding.analysisRun.status,
      startedAt: finding.analysisRun.startedAt?.toISOString() ?? null,
      completedAt: finding.analysisRun.completedAt?.toISOString() ?? null,
    },
  }));
}

export async function getAnalysisRunByIdForUser(
  userId: string,
  analysisRunId: string,
): Promise<AnalysisRunDetail> {
  const run = await prisma.analysisRun.findFirst({
    where: {
      id: analysisRunId,
      event: {
        repository: {
          installation: {
            installedByUserId: userId,
          },
        },
      },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      errorMessage: true,
      event: {
        select: {
          id: true,
          type: true,
          githubEventId: true,
          processed: true,
          payload: true,
          createdAt: true,
          repository: {
            select: {
              id: true,
              name: true,
              fullName: true,
              status: true,
              isActive: true,
              defaultBranch: true,
              private: true,
            },
          },
        },
      },
      findings: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          repositoryId: true,
          type: true,
          severity: true,
          title: true,
          description: true,
          metadata: true,
          createdAt: true,
        },
      },
    },
  });

  if (!run) {
    throw new AppError('Analysis run not found', 404, 'ANALYSIS_RUN_NOT_FOUND');
  }

  return {
    id: run.id,
    status: run.status,
    createdAt: run.createdAt.toISOString(),
    startedAt: run.startedAt?.toISOString() ?? null,
    completedAt: run.completedAt?.toISOString() ?? null,
    errorMessage: run.errorMessage,
    repository: {
      id: run.event.repository.id,
      name: run.event.repository.name,
      fullName: run.event.repository.fullName,
      status: run.event.repository.status,
      isActive: run.event.repository.isActive,
      defaultBranch: run.event.repository.defaultBranch,
      private: run.event.repository.private,
    },
    event: {
      id: run.event.id,
      type: run.event.type,
      githubEventId: run.event.githubEventId,
      processed: run.event.processed,
      payload: run.event.payload,
      createdAt: run.event.createdAt.toISOString(),
    },
    findings: run.findings.map((finding) => ({
      id: finding.id,
      repositoryId: finding.repositoryId,
      type: finding.type,
      severity: finding.severity,
      title: finding.title,
      description: finding.description,
      metadata: finding.metadata,
      createdAt: finding.createdAt.toISOString(),
    })),
  };
}
