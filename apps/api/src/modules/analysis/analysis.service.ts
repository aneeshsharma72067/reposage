import type { FastifyBaseLogger } from 'fastify';
import { prisma } from '../../lib/prisma';
import type { AnalysisRunListItem, GitHubPushPayload } from './analysis.types';

const ANALYSIS_SIMULATION_DELAY_MS = 5_000;

interface TriggerAnalysisInput {
  payload: GitHubPushPayload;
  logger: FastifyBaseLogger;
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
        await tx.analysisRun.update({
          where: { id: analysisRunId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        await tx.repository.update({
          where: { id: repositoryId },
          data: { status: 'healthy' },
        });
      });

      logger.info(
        {
          event: 'analysis.run.completed',
          analysisRunId,
          repositoryId,
          newStatus: 'completed',
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
        await prisma.analysisRun.update({
          where: { id: analysisRunId },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errorMessage:
              error instanceof Error
                ? error.message
                : 'Unknown error during analysis completion',
          },
        });
      } catch (fallbackError) {
        logger.error(
          {
            event: 'analysis.run.fallback_failed',
            analysisRunId,
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
  console.log('payload -> ', payload);

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
        type: 'PUSH',
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
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    await tx.event.update({
      where: { id: event.id },
      data: { processed: true },
    });

    await tx.repository.update({
      where: { id: repository.id },
      data: { status: 'analyzing' },
    });

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

