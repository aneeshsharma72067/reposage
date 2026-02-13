import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
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
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  request.currentUser = {
    id: user.id,
    githubUserId: user.githubUserId.toString(),
    githubLogin: user.githubLogin,
    avatarUrl: user.avatarUrl,
  };
}

