import { prisma } from '../../lib/prisma';
import type { FindingListItem } from './findings.types';

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

