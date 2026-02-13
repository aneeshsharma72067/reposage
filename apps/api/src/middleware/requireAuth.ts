import type { FastifyReply, FastifyRequest } from 'fastify';
import { query } from '../db';
import { AppError } from '../utils/errors';
import type {
  AuthJwtPayload,
  AuthenticatedUser,
} from '../modules/auth/auth.types';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: AuthenticatedUser;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  let payload: AuthJwtPayload;

  try {
    payload = await request.jwtVerify<AuthJwtPayload>();
  } catch {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  if (!payload.sub) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const result = await query<{
    id: string;
    github_user_id: string;
    github_login: string;
    avatar_url: string | null;
  }>(
    `
      SELECT id, github_user_id, github_login, avatar_url
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [payload.sub],
  );

  const user = result.rows[0];

  if (!user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  request.currentUser = {
    id: user.id,
    githubUserId: user.github_user_id,
    githubLogin: user.github_login,
    avatarUrl: user.avatar_url,
  };
}

