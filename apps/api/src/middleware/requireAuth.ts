import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { SESSION_COOKIE_NAME } from '../plugins/jwt';
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
  const hasSessionCookie = Boolean(request.cookies?.[SESSION_COOKIE_NAME]);
  const hasAuthorizationHeader = Boolean(request.headers.authorization);

  console.log('[requireAuth] Authenticating request', {
    method: request.method,
    url: request.url,
    hasSessionCookie,
    hasAuthorizationHeader,
    authMode: 'cookie',
  });

  try {
    payload = await request.jwtVerify<AuthJwtPayload>({
      onlyCookie: true,
    });
  } catch (error) {
    console.log('[requireAuth] Cookie JWT verification failed', {
      hasSessionCookie,
      hasAuthorizationHeader,
      reason: error instanceof Error ? error.message : 'unknown',
    });
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  if (!payload.sub) {
    console.log('[requireAuth] Authentication failed: missing JWT sub', {
      hasSessionCookie,
      hasAuthorizationHeader,
    });
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.sub,
    },
    select: {
      id: true,
      githubUserId: true,
      githubLogin: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    console.log('[requireAuth] Authentication failed: user not found', {
      hasSessionCookie,
      userId: payload.sub,
    });
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  console.log('[requireAuth] Authentication succeeded', {
    userId: user.id,
    githubLogin: user.githubLogin,
  });

  request.currentUser = {
    id: user.id,
    githubUserId: user.githubUserId.toString(),
    githubLogin: user.githubLogin,
    avatarUrl: user.avatarUrl,
  };
}

