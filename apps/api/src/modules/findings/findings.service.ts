import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import type { FindingDetail, FindingListItem } from './findings.types';

export async function listFindingsForUser(
  userId: string,
): Promise<FindingListItem[]> {
  const findings = await prisma.finding.findMany({
    where: {
      repository: {
        installation: {
          installedByUserId: userId,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 200,
    select: {
      id: true,
      analysisRunId: true,
      repositoryId: true,
      type: true,
      severity: true,
      title: true,
      description: true,
      metadata: true,
      createdAt: true,
    },
  });

  return findings.map((finding) => ({
    id: finding.id,
    analysisRunId: finding.analysisRunId,
    repositoryId: finding.repositoryId,
    type: finding.type,
    severity: finding.severity,
    title: finding.title,
    description: finding.description,
    metadata: finding.metadata,
    createdAt: finding.createdAt.toISOString(),
  }));
}

export async function getFindingByIdForUser(
  userId: string,
  findingId: string,
): Promise<FindingDetail> {
  const finding = await prisma.finding.findFirst({
    where: {
      id: findingId,
      repository: {
        installation: {
          installedByUserId: userId,
        },
      },
    },
    select: {
      id: true,
      analysisRunId: true,
      repositoryId: true,
      type: true,
      severity: true,
      title: true,
      description: true,
      metadata: true,
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
      analysisRun: {
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
            },
          },
        },
      },
    },
  });

  if (!finding) {
    throw new AppError('Finding not found', 404, 'FINDING_NOT_FOUND');
  }

  return {
    id: finding.id,
    analysisRunId: finding.analysisRunId,
    repositoryId: finding.repositoryId,
    type: finding.type,
    severity: finding.severity,
    title: finding.title,
    description: finding.description,
    metadata: finding.metadata,
    createdAt: finding.createdAt.toISOString(),
    repository: {
      id: finding.repository.id,
      name: finding.repository.name,
      fullName: finding.repository.fullName,
      status: finding.repository.status,
      isActive: finding.repository.isActive,
      defaultBranch: finding.repository.defaultBranch,
      private: finding.repository.private,
    },
    analysisRun: {
      id: finding.analysisRun.id,
      status: finding.analysisRun.status,
      createdAt: finding.analysisRun.createdAt.toISOString(),
      startedAt: finding.analysisRun.startedAt?.toISOString() ?? null,
      completedAt: finding.analysisRun.completedAt?.toISOString() ?? null,
      errorMessage: finding.analysisRun.errorMessage,
      event: {
        id: finding.analysisRun.event.id,
        type: finding.analysisRun.event.type,
        githubEventId: finding.analysisRun.event.githubEventId,
        processed: finding.analysisRun.event.processed,
        payload: finding.analysisRun.event.payload,
        createdAt: finding.analysisRun.event.createdAt.toISOString(),
      },
    },
  };
}

