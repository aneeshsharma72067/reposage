export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('Missing NEXT_PUBLIC_API_URL environment variable');
  }

  return stripTrailingSlash(apiUrl);
}

export function getGithubApiBaseUrl(): string {
  const githubApiUrl = process.env.NEXT_PUBLIC_GITHUB_API_URL ?? 'https://api.github.com';
  return stripTrailingSlash(githubApiUrl);
}

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
  token?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  if (baseUrl.includes('ngrok-free.dev')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  if (!headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (response.status === 401) {
    throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  if (!response.ok) {
    let payload: { message?: string; error?: string } | null = null;

    try {
      payload = (await response.json()) as { message?: string; error?: string };
    } catch {
      payload = null;
    }

    throw new ApiError(response.status, payload?.message ?? 'Request failed', payload?.error);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function githubApiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getGithubApiBaseUrl();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    ...(options.headers ?? {}),
  };

  if (!headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    let payload: { message?: string; error?: string } | null = null;

    try {
      payload = (await response.json()) as { message?: string; error?: string };
    } catch {
      payload = null;
    }

    throw new ApiError(
      response.status,
      payload?.message ?? 'GitHub request failed',
      payload?.error,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
