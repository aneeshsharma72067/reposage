import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env';
import { AppError } from '../../utils/errors';
import {
  getGithubAppInstallationUrl,
  linkInstallationToUser,
} from './installation.service';
import type { InstallationCallbackQuery } from './installation.types';

export async function startInstallation(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  console.log('[install] /install route reached', {
    userId: request.currentUser?.id ?? null,
    githubLogin: request.currentUser?.githubLogin ?? null,
  });

  reply.redirect(getGithubAppInstallationUrl());
}

export async function installationCallback(
  request: FastifyRequest<{
    Querystring: InstallationCallbackQuery;
  }>,
  reply: FastifyReply,
): Promise<void> {
  const installationId = request.query.installation_id;

  if (!installationId) {
    throw new AppError(
      'Missing installation_id query parameter',
      400,
      'INSTALLATION_ID_MISSING',
    );
  }

  if (!request.currentUser) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  await linkInstallationToUser(
    {
      installationId,
      user: request.currentUser,
    },
    request.log,
  );

  reply.redirect(env.FRONTEND_URL);
}

