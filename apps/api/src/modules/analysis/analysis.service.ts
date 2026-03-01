import type { FastifyBaseLogger } from 'fastify';
import {
  AnalysisStatus,
  EventType,
  Prisma,
  RepositoryStatus,
} from '@prisma/client';
import { prisma } from '../../lib/prisma';
import type { AnalysisRunListItem, GitHubPushPayload } from './analysis.types';

const ANALYSIS_SIMULATION_DELAY_MS = 5_000;

interface TriggerAnalysisInput {
  payload: GitHubPushPayload;
  logger: FastifyBaseLogger;
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

  await tx.repository.update({
    where: { id: repositoryId },
    data: { status: RepositoryStatus.HEALTHY },
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

/**
 * Simulates async analysis completion after a short delay.
 * Temporary — will be replaced by queue.publish() + worker.process().
 *
 * MUST NOT be awaited. Fire-and-forget by design.
 */
function scheduleAnalysisCompletion(
  analysisRunId: string,
  repositoryId: string,
  logger: FastifyBaseLogger,
): void {
  setTimeout(async () => {
    try {
      await prisma.$transaction(async (tx) => {
        await transitionAnalysisRunToCompleted(tx, analysisRunId, repositoryId);
      });

      logger.info(
        {
          event: 'analysis.run.completed',
          analysisRunId,
          repositoryId,
          newStatus: AnalysisStatus.COMPLETED,
        },
        'Analysis run completed (simulated)',
      );
    } catch (error) {
      logger.error(
        {
          event: 'analysis.run.completion_failed',
          analysisRunId,
          repositoryId,
          err: error,
        },
        'Failed to complete analysis run, marking as failed',
      );

      try {
        const lifecycleErrorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown error during analysis completion';

        await prisma.$transaction(async (tx) => {
          await transitionAnalysisRunToFailed(
            tx,
            analysisRunId,
            repositoryId,
            lifecycleErrorMessage,
          );
        });

        logger.info(
          {
            event: 'analysis.run.failed',
            analysisRunId,
            repositoryId,
            newStatus: AnalysisStatus.FAILED,
          },
          'Analysis run marked as failed',
        );
      } catch (fallbackError) {
        logger.error(
          {
            event: 'analysis.run.fallback_failed',
            analysisRunId,
            repositoryId,
            err: fallbackError,
          },
          'Failed to mark analysis run as failed',
        );
      }
    }
  }, ANALYSIS_SIMULATION_DELAY_MS);
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

    await transitionAnalysisRunToRunning(tx, analysisRun.id, repository.id);

    return { eventId: event.id, analysisRunId: analysisRun.id };
  });

  // Fire-and-forget: simulate async completion (will be replaced by queue worker)
  scheduleAnalysisCompletion(result.analysisRunId, repository.id, logger);

  logger.info(
    {
      event: 'analysis.push.triggered',
      repositoryId: repository.id,
      repositoryFullName: repository.fullName,
      analysisRunId: result.analysisRunId,
      eventId: result.eventId,
      eventType: 'push',
    },
    'Analysis run created from push event',
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

