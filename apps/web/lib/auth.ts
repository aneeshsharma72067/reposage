import { apiRequest, getApiBaseUrl, getGithubApiBaseUrl, githubApiRequest } from '@/lib/api';
import { ApiError } from '@/lib/api';
import type { RepositoryCommit, RepositoryDetails, RepositoryListItem } from '@/types/repository';

const ACCESS_TOKEN_STORAGE_KEY = 'ae_access_token';

export interface SessionState {
  isAuthenticated: boolean;
  hasConnectedRepositories: boolean;
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

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getAccessToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function consumeAccessTokenFromHash(): string | null {
  if (!isBrowser()) {
    return null;
  }

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;

  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash);
  const token = params.get('access_token');

  if (!token) {
    return null;
  }

  setAccessToken(token);
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.search,
  );
  return token;
}

export async function listRepositories(): Promise<RepositoryListItem[]> {
  const token = getAccessToken();

  if (!token) {
    throw new Error('MISSING_ACCESS_TOKEN');
  }

  try {
    return await apiRequest<RepositoryListItem[]>('/repos', {
      method: 'GET',
      token,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAccessToken();
    }

    throw error;
  }
}

export async function getRepositoryDetails(repositoryId: string): Promise<RepositoryDetails> {
  const token = getAccessToken();

  if (!token) {
    throw new Error('MISSING_ACCESS_TOKEN');
  }

  try {
    const details = await apiRequest<RepositoryDetails>(`/repos/${repositoryId}/details`, {
      method: 'GET',
      token,
    });

    try {
      const githubDetails = await githubApiRequest<GithubRepositoryDetailsResponse>(
        `/repos/${details.fullName}`,
        {
          method: 'GET',
        },
      );

      const githubCommits = await githubApiRequest<GithubCommitResponse[]>(
        `/repos/${details.fullName}/commits?per_page=10`,
        {
          method: 'GET',
        },
      );

      const recentCommits: RepositoryCommit[] = Array.isArray(githubCommits)
        ? githubCommits
            .filter((commit) => typeof commit.sha === 'string')
            .map((commit) => ({
              sha: commit.sha as string,
              message: commit.commit?.message ?? 'No commit message',
              authorName: commit.commit?.author?.name ?? null,
              authoredAt: commit.commit?.author?.date ?? null,
              url: commit.html_url ?? `${details.htmlUrl}/commit/${commit.sha}`,
            }))
        : details.recentCommits;

      return {
        ...details,
        htmlUrl: githubDetails.html_url ?? details.htmlUrl,
        description: githubDetails.description ?? details.description,
        homepage: githubDetails.homepage ?? details.homepage,
        defaultBranch: githubDetails.default_branch ?? details.defaultBranch,
        language: githubDetails.language ?? details.language,
        topics: Array.isArray(githubDetails.topics) ? githubDetails.topics : details.topics,
        stargazersCount: githubDetails.stargazers_count ?? details.stargazersCount,
        watchersCount: githubDetails.watchers_count ?? details.watchersCount,
        forksCount: githubDetails.forks_count ?? details.forksCount,
        openIssuesCount: githubDetails.open_issues_count ?? details.openIssuesCount,
        subscribersCount: githubDetails.subscribers_count ?? details.subscribersCount,
        size: githubDetails.size ?? details.size,
        archived: githubDetails.archived ?? details.archived,
        disabled: githubDetails.disabled ?? details.disabled,
        visibility:
          githubDetails.visibility ??
          details.visibility ??
          (githubDetails.private ? 'private' : 'public'),
        licenseName: githubDetails.license?.name ?? details.licenseName,
        pushedAt: githubDetails.pushed_at ?? details.pushedAt,
        updatedAt: githubDetails.updated_at ?? details.updatedAt,
        createdAt: githubDetails.created_at ?? details.createdAt,
        recentCommits,
      };
    } catch {
      return details;
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAccessToken();
    }

    throw error;
  }
}

export async function getSessionState(): Promise<SessionState> {
  const token = getAccessToken();

  if (!token) {
    return {
      isAuthenticated: false,
      hasConnectedRepositories: false,
    };
  }

  try {
    const repositories = await listRepositories();
    return {
      isAuthenticated: true,
      hasConnectedRepositories: repositories.length > 0,
    };
  } catch {
    return {
      isAuthenticated: false,
      hasConnectedRepositories: false,
    };
  }
}

export async function getInstallationUrl(): Promise<string> {
  const token = getAccessToken();

  if (!token) {
    throw new Error('MISSING_ACCESS_TOKEN');
  }

  const response = await apiRequest<{ url: string }>('/install/url', {
    method: 'GET',
    token,
  });

  return response.url;
}

export { getApiBaseUrl };
export { getGithubApiBaseUrl };
