import { apiRequest, getApiBaseUrl } from '@/lib/api';
import { ApiError } from '@/lib/api';
import type { RepositoryListItem } from '@/types/repository';

const ACCESS_TOKEN_STORAGE_KEY = 'ae_access_token';

export interface SessionState {
  isAuthenticated: boolean;
  hasConnectedRepositories: boolean;
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
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
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
