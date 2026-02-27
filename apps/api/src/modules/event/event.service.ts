import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import type { EventDetail, EventListItem } from './event.types';

export async function listEventsForUser(
  userId: string,
): Promise<EventListItem[]> {
  const events = await prisma.event.findMany({
    where: {
      repository: {
        installation: {
          installedByUserId: userId,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      repositoryId: true,
      githubEventId: true,
      type: true,
      processed: true,
      createdAt: true,
      repository: {
        select: { name: true },
      },
    },
  });

  return events.map((event) => ({
    id: event.id,
    repositoryId: event.repositoryId,
    repositoryName: event.repository.name,
    githubEventId: event.githubEventId,
    type: event.type,
    processed: event.processed,
    createdAt: event.createdAt.toISOString(),
  }));
}

export async function getEventByIdForUser(
  userId: string,
  eventId: string,
): Promise<EventDetail> {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      repository: {
        installation: {
          installedByUserId: userId,
        },
      },
    },
    select: {
      id: true,
      repositoryId: true,
      githubEventId: true,
      type: true,
      payload: true,
      processed: true,
      createdAt: true,
      repository: {
        select: { name: true },
      },
      analysisRuns: {
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
          errorMessage: true,
        },
      },
    },
  });

  if (!event) {
    throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
  }

  return {
    id: event.id,
    repositoryId: event.repositoryId,
    repositoryName: event.repository.name,
    githubEventId: event.githubEventId,
    type: event.type,
    payload: event.payload,
    processed: event.processed,
    createdAt: event.createdAt.toISOString(),
    analysisRuns: event.analysisRuns.map((run) => ({
      id: run.id,
      status: run.status,
      startedAt: run.startedAt?.toISOString() ?? null,
      completedAt: run.completedAt?.toISOString() ?? null,
      errorMessage: run.errorMessage,
    })),
  };
}

