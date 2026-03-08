import { RepositoryStatus } from '@prisma/client';
import { Octokit } from '@octokit/rest';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { generateInstallationAccessToken } from '../../modules/githubApp/githubApp.service';

interface SyncRepositoriesResult {
  created: number;
}

interface SyncableInstallation {
  id: string;
  installationId: bigint;
}

interface InstallationRepositoryPayload {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string | null;
  owner: {
    login: string;
    type: string;
  };
}

function isInstallationRepositoryPayload(
  value: unknown,
): value is InstallationRepositoryPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === 'number' &&
    typeof record.name === 'string' &&
    typeof record.full_name === 'string' &&
    typeof record.private === 'boolean' &&
    (typeof record.default_branch === 'string' ||
      record.default_branch === null) &&
    typeof record.owner === 'object' &&
    record.owner !== null &&
    typeof (record.owner as Record<string, unknown>).login === 'string' &&
    typeof (record.owner as Record<string, unknown>).type === 'string'
  );
}

async function listUserInstallations(
  userId: string,
): Promise<SyncableInstallation[]> {
  return prisma.githubInstallation.findMany({
    where: {
      installedByUserId: userId,
    },
    select: {
      id: true,
      installationId: true,
    },
  });
}

async function fetchInstallationRepositories(
  installationId: bigint,
): Promise<InstallationRepositoryPayload[]> {
  const installationToken =
    await generateInstallationAccessToken(installationId);

  const octokit = new Octokit({
    auth: installationToken,
  });

  try {
    const repositories = await octokit.paginate(
      octokit.rest.apps.listReposAccessibleToInstallation,
      {
        per_page: 100,
      },
    );

    if (!Array.isArray(repositories)) {
      throw new AppError(
        'Invalid repositories response from GitHub',
        502,
        'GITHUB_INSTALLATION_REPOSITORIES_INVALID_RESPONSE',
      );
    }

    const invalidRepository = repositories.find(
      (repository) => !isInstallationRepositoryPayload(repository),
    );

    if (invalidRepository) {
      throw new AppError(
        'Invalid repository payload from GitHub',
        502,
        'GITHUB_INSTALLATION_REPOSITORIES_INVALID_RESPONSE',
      );
    }

    return repositories;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      'Failed to fetch installation repositories',
      502,
      'GITHUB_INSTALLATION_REPOSITORIES_FETCH_FAILED',
    );
  }
}

async function syncInstallationRepositories(
  installation: SyncableInstallation,
): Promise<number> {
  const repositories = await fetchInstallationRepositories(
    installation.installationId,
  );

  if (repositories.length === 0) {
    return 0;
  }

  const githubRepoIds = repositories.map((repository) => BigInt(repository.id));
  const existingRepositories = await prisma.repository.findMany({
    where: {
      githubRepoId: {
        in: githubRepoIds,
      },
    },
    select: {
      githubRepoId: true,
    },
  });

  const existingRepositoryIds = new Set(
    existingRepositories.map((repository) =>
      repository.githubRepoId.toString(),
    ),
  );

  await prisma.$transaction(
    repositories.map((repository) =>
      prisma.repository.upsert({
        where: {
          githubRepoId: BigInt(repository.id),
        },
        update: {
          installationId: installation.id,
          name: repository.name,
          fullName: repository.full_name,
          private: repository.private,
          defaultBranch: repository.default_branch,
          ownerLogin: repository.owner.login,
          ownerType: repository.owner.type,
          status: RepositoryStatus.IDLE,
          isActive: true,
        },
        create: {
          githubRepoId: BigInt(repository.id),
          installationId: installation.id,
          name: repository.name,
          fullName: repository.full_name,
          private: repository.private,
          defaultBranch: repository.default_branch,
          ownerLogin: repository.owner.login,
          ownerType: repository.owner.type,
          status: RepositoryStatus.IDLE,
          isActive: true,
        },
      }),
    ),
  );

  return repositories.reduce((createdCount, repository) => {
    if (existingRepositoryIds.has(repository.id.toString())) {
      return createdCount;
    }

    return createdCount + 1;
  }, 0);
}

export async function syncRepositories(
  userId: string,
): Promise<SyncRepositoriesResult> {
  const installations = await listUserInstallations(userId);

  if (installations.length === 0) {
    throw new AppError(
      'GitHub installation not found for user',
      404,
      'INSTALLATION_NOT_FOUND',
    );
  }

  let created = 0;
  for (const installation of installations) {
    created += await syncInstallationRepositories(installation);
  }

  console.info({
    event: 'repositories.manual_sync.completed',
    userId,
    installationCount: installations.length,
    created,
  });

  return { created };
}

