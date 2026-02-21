import { prisma } from '../../lib/prisma';
import type { RepositoryListItem } from './repository.types';

export async function listRepositoriesForUser(
  userId: string,
): Promise<RepositoryListItem[]> {
  const userInstallations = await prisma.githubInstallation.findMany({
    where: {
      installedByUserId: userId,
    },
    select: {
      id: true,
    },
  });

  const installationIds = userInstallations.map(
    (installation) => installation.id,
  );

  if (installationIds.length === 0) {
    return [];
  }

  const repositories = await prisma.repository.findMany({
    where: {
      installationId: {
        in: installationIds,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      githubRepoId: true,
      name: true,
      fullName: true,
      private: true,
      defaultBranch: true,
      installationId: true,
      isActive: true,
    },
  });

  return repositories.map((repository) => ({
    id: repository.id,
    githubRepoId: repository.githubRepoId.toString(),
    name: repository.name,
    fullName: repository.fullName,
    private: repository.private,
    defaultBranch: repository.defaultBranch ?? '',
    installationId: repository.installationId,
    isActive: repository.isActive,
  }));
}

