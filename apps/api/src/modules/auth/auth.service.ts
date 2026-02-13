import type { FastifyInstance } from 'fastify';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import type {
  AuthJwtPayload,
  GithubAccessTokenResponse,
  GithubUserProfile,
  UserRecord,
} from './auth.types';

function toJsonString(body: Record<string, string>): string {
  return new URLSearchParams(body).toString();
}

export function getGithubAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope: 'read:user',
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForAccessToken(
  code: string,
): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'agentic-engineering-workflow-ai',
    },
    body: toJsonString({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL,
    }),
  });

  if (!response.ok) {
    throw new AppError(
      'GitHub OAuth token exchange failed',
      502,
      'GITHUB_OAUTH_FAILED',
    );
  }

  const data = (await response.json()) as Partial<GithubAccessTokenResponse> & {
    error?: string;
  };

  if (!data.access_token || data.error) {
    throw new AppError(
      'GitHub OAuth token missing',
      401,
      'INVALID_GITHUB_OAUTH_CODE',
    );
  }

  return data.access_token;
}

export async function fetchGithubUserProfile(
  accessToken: string,
): Promise<GithubUserProfile> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'agentic-engineering-workflow-ai',
    },
  });

  if (!response.ok) {
    throw new AppError(
      'Failed to fetch GitHub profile',
      502,
      'GITHUB_PROFILE_FETCH_FAILED',
    );
  }

  const profile = (await response.json()) as Partial<GithubUserProfile>;

  if (!profile.id || !profile.login) {
    throw new AppError(
      'Invalid GitHub profile payload',
      502,
      'GITHUB_PROFILE_INVALID',
    );
  }

  return {
    id: profile.id,
    login: profile.login,
    avatar_url: profile.avatar_url ?? null,
  };
}

export async function upsertGithubUser(
  profile: GithubUserProfile,
): Promise<UserRecord> {
  const user = await prisma.user.upsert({
    where: {
      githubUserId: BigInt(profile.id),
    },
    update: {
      githubLogin: profile.login,
      avatarUrl: profile.avatar_url,
    },
    create: {
      githubUserId: BigInt(profile.id),
      githubLogin: profile.login,
      avatarUrl: profile.avatar_url,
    },
  });

  if (!user) {
    throw new AppError(
      'Failed to persist GitHub user',
      500,
      'USER_UPSERT_FAILED',
    );
  }

  return {
    id: user.id,
    github_user_id: user.githubUserId.toString(),
    github_login: user.githubLogin,
    avatar_url: user.avatarUrl,
  };
}

export async function signSessionToken(
  app: FastifyInstance,
  user: UserRecord,
): Promise<string> {
  const payload: AuthJwtPayload = {
    sub: user.id,
    githubUserId: user.github_user_id,
    login: user.github_login,
  };

  return app.jwt.sign(payload, { expiresIn: '7d' });
}

