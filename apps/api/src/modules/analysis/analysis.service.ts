import type { FastifyBaseLogger } from 'fastify';
import {
  AnalysisStatus,
  EventType,
  FindingType,
  Prisma,
  RepositoryStatus,
  SeverityLevel,
} from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { analysisQueue } from '../../lib/queue';
import type {
  AnalysisFindingListItem,
  AnalysisRunListItem,
  GitHubPushPayload,
} from './analysis.types';

interface TriggerAnalysisInput {
  payload: GitHubPushPayload;
  logger: FastifyBaseLogger;
}

function selectSimulatedSeverity(): SeverityLevel {
  const severityIndex = Math.floor(Math.random() * 3);

  if (severityIndex === 0) {
    return SeverityLevel.INFO;
  }

  if (severityIndex === 1) {
    return SeverityLevel.WARNING;
  }

  return SeverityLevel.CRITICAL;
}

async function evaluateRepositoryHealth(
  runId: string,
  tx: Prisma.TransactionClient = prisma,
): Promise<RepositoryStatus> {
  const criticalFindingsCount = await tx.finding.count({
    where: {
      analysisRunId: runId,
      severity: SeverityLevel.CRITICAL,
    },
  });

  if (criticalFindingsCount > 0) {
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
      status: AnalysisStatus.PENDING,
      startedAt: null,
      completedAt: null,
    },
    data: {
      status: AnalysisStatus.RUNNING,
      startedAt,
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

  await tx.finding.create({
    data: {
      analysisRunId,
      repositoryId,
      type: FindingType.API_BREAK,
      severity: selectSimulatedSeverity(),
      title: 'Simulated API contract change',
      description:
        'This is a simulated finding generated during analysis lifecycle testing.',
      metadata: {
        source: 'analysis-worker',
        runId: analysisRunId,
      },
    },
  });

  const repositoryHealth = await evaluateRepositoryHealth(analysisRunId, tx);

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

export async function processAnalysisRun(analysisRunId: string): Promise<void> {
  const run = await prisma.analysisRun.findUnique({
    where: { id: analysisRunId },
    select: {
      id: true,
      status: true,
      event: {
        select: {
          repositoryId: true,
        },
      },
    },
  });

  if (!run) {
    throw new Error(`Analysis run not found: ${analysisRunId}`);
  }

  const repositoryId = run.event.repositoryId;

  try {
    await prisma.$transaction(async (tx) => {
      await transitionAnalysisRunToRunning(tx, analysisRunId, repositoryId);
      await transitionAnalysisRunToCompleted(tx, analysisRunId, repositoryId);
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
          analysisRunId,
          repositoryId,
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
    await analysisQueue.add('process-analysis', {
      analysisRunId: result.analysisRunId,
      eventId: result.eventId,
      repositoryId: repository.id,
    });
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

