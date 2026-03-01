import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import {
  generateInstallationAccessToken,
  resolveRepositoryInstallationId,
} from '../githubApp/githubApp.service';
import type { RepositoryDetails, RepositoryListItem } from './repository.types';

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
      status: true,
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
    status: repository.status,
  }));
}

interface GithubRepositoryDetailsResponse {
  html_url?: string;
  description?: string | null;
  homepage?: string | null;
  default_branch?: string;
  language?: string | null;
  topics?: string[];
  stargazers_count?: number;
  watchers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  subscribers_count?: number;
  size?: number;
  archived?: boolean;
  disabled?: boolean;
  visibility?: string;
  private?: boolean;
  license?: {
    name?: string;
  } | null;
  pushed_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

interface GithubCommitResponse {
  sha?: string;
  html_url?: string;
  commit?: {
    message?: string;
    author?: {
      name?: string;
      date?: string;
    };
  };
}

export async function getRepositoryDetailsForUser(
  userId: string,
  repositoryId: string,
): Promise<RepositoryDetails> {
  console.info({
    event: 'repository.details.request.start',
    userId,
    repositoryId,
  });

  const repository = await prisma.repository.findFirst({
    where: {
      id: repositoryId,
      installation: {
        installedByUserId: userId,
      },
    },
    select: {
      id: true,
      githubRepoId: true,
      name: true,
      fullName: true,
      private: true,
      defaultBranch: true,
      isActive: true,
    },
  });

  if (!repository) {
    console.warn({
      event: 'repository.details.request.not_found',
      userId,
      repositoryId,
    });

    throw new AppError('Repository not found', 404, 'REPOSITORY_NOT_FOUND');
  }

  const [owner, repo] = repository.fullName.split('/');

  if (!owner || !repo) {
    console.error({
      event: 'repository.details.request.invalid_full_name',
      repositoryId,
      fullName: repository.fullName,
    });

    throw new AppError(
      'Invalid repository full name',
      500,
      'REPOSITORY_FULL_NAME_INVALID',
    );
  }

  console.info({
    event: 'repository.details.github.flow.start',
    repositoryId,
    fullName: repository.fullName,
    owner,
    repo,
  });

  const installationId = await resolveRepositoryInstallationId(owner, repo);

  console.info({
    event: 'repository.details.github.installation.resolved',
    repositoryId,
    installationId: installationId.toString(),
  });

  const installationToken =
    await generateInstallationAccessToken(installationId);

  console.info({
    event: 'repository.details.github.installation.token.ready',
    repositoryId,
    installationId: installationId.toString(),
  });

  const [detailsResponse, commitsResponse] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${installationToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${installationToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }),
  ]);

  if (!detailsResponse.ok) {
    console.error({
      event: 'repository.details.github.fetch.failed',
      repositoryId,
      fullName: repository.fullName,
      status: detailsResponse.status,
    });

    if (detailsResponse.status === 404) {
      throw new AppError(
        'Repository not found on GitHub',
        404,
        'GITHUB_REPOSITORY_NOT_FOUND',
      );
    }

    throw new AppError(
      'Failed to fetch repository details from GitHub',
      502,
      'GITHUB_REPOSITORY_FETCH_FAILED',
    );
  }

  if (!commitsResponse.ok) {
    console.error({
      event: 'repository.details.github.commits.fetch.failed',
      repositoryId,
      fullName: repository.fullName,
      status: commitsResponse.status,
    });

    throw new AppError(
      'Failed to fetch repository commits from GitHub',
      502,
      'GITHUB_REPOSITORY_COMMITS_FETCH_FAILED',
    );
  }

  const payload =
    (await detailsResponse.json()) as GithubRepositoryDetailsResponse;
  const commitsPayload =
    (await commitsResponse.json()) as GithubCommitResponse[];

  const recentCommits = Array.isArray(commitsPayload)
    ? commitsPayload
        .filter((commit) => typeof commit.sha === 'string')
        .map((commit) => ({
          sha: commit.sha as string,
          message: commit.commit?.message ?? 'No commit message',
          authorName: commit.commit?.author?.name ?? null,
          authoredAt: commit.commit?.author?.date ?? null,
          url:
            commit.html_url ??
            `https://github.com/${repository.fullName}/commit/${commit.sha}`,
        }))
    : [];

  console.info({
    event: 'repository.details.request.success',
    repositoryId,
    fullName: repository.fullName,
    commitCount: recentCommits.length,
  });

  return {
    id: repository.id,
    githubRepoId: repository.githubRepoId.toString(),
    name: repository.name,
    fullName: repository.fullName,
    private: payload.private ?? repository.private,
    isActive: repository.isActive,
    htmlUrl: payload.html_url ?? `https://github.com/${repository.fullName}`,
    description: payload.description ?? null,
    homepage: payload.homepage ?? null,
    defaultBranch: payload.default_branch ?? repository.defaultBranch ?? '',
    language: payload.language ?? null,
    topics: Array.isArray(payload.topics) ? payload.topics : [],
    stargazersCount: payload.stargazers_count ?? 0,
    watchersCount: payload.watchers_count ?? 0,
    forksCount: payload.forks_count ?? 0,
    openIssuesCount: payload.open_issues_count ?? 0,
    subscribersCount: payload.subscribers_count ?? 0,
    size: payload.size ?? 0,
    recentCommits,
    archived: payload.archived ?? false,
    disabled: payload.disabled ?? false,
    visibility: payload.visibility ?? (payload.private ? 'private' : 'public'),
    licenseName: payload.license?.name ?? null,
    pushedAt: payload.pushed_at ?? null,
    updatedAt: payload.updated_at ?? null,
    createdAt: payload.created_at ?? null,
  };
}

