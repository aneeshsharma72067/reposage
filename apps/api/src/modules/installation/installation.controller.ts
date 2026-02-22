import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { syncInstallationRepositories } from '../githubApp/githubApp.service';
import { AppError } from '../../utils/errors';
import {
  getGithubAppInstallationUrlWithState,
  linkInstallationToUser,
} from './installation.service';
import type {
  InstallationCallbackQuery,
  InstallationStartResponse,
  InstallationStatePayload,
} from './installation.types';

async function getInstallationStateToken(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<string> {
  if (!request.currentUser) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  return reply.jwtSign(
    {
      sub: request.currentUser.id,
      githubLogin: request.currentUser.githubLogin,
      githubUserId: request.currentUser.githubUserId,
      purpose: 'installation',
    } satisfies InstallationStatePayload,
    { expiresIn: '10m' },
  );
}

async function resolveUserFromState(
  request: FastifyRequest<{ Querystring: InstallationCallbackQuery }>,
): Promise<{ id: string; githubLogin: string; githubUserId: string; avatarUrl: string | null }> {
  const state = request.query.state;

  if (!state) {
    throw new AppError('Missing installation state parameter', 400, 'INSTALLATION_STATE_MISSING');
  }

  let payload: InstallationStatePayload;

  try {
    payload = request.server.jwt.verify<InstallationStatePayload>(state);
  } catch {
    throw new AppError('Invalid installation state parameter', 400, 'INSTALLATION_STATE_INVALID');
  }

  if (payload.purpose !== 'installation' || !payload.sub) {
    throw new AppError('Invalid installation state payload', 400, 'INSTALLATION_STATE_INVALID');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      githubLogin: true,
      githubUserId: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  return {
    id: user.id,
    githubLogin: user.githubLogin,
    githubUserId: user.githubUserId.toString(),
    avatarUrl: user.avatarUrl,
  };
}

export async function startInstallation(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  console.log('[install] /install route reached', {
    userId: request.currentUser?.id ?? null,
    githubLogin: request.currentUser?.githubLogin ?? null,
  });

  const stateToken = await getInstallationStateToken(request, reply);
  const installUrl = getGithubAppInstallationUrlWithState(stateToken);

  reply.redirect(installUrl);
}

export async function getInstallationUrl(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const stateToken = await getInstallationStateToken(request, reply);
  const installUrl = getGithubAppInstallationUrlWithState(stateToken);

  reply.send({ url: installUrl } satisfies InstallationStartResponse);
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

  if (!/^\d+$/.test(installationId)) {
    throw new AppError(
      'Invalid installation_id query parameter',
      400,
      'INSTALLATION_ID_INVALID',
    );
  }

  const currentUser = await resolveUserFromState(request);

  await linkInstallationToUser(
    {
      installationId,
      user: currentUser,
    },
    request.log,
  );

  const normalizedInstallationId = BigInt(installationId);

  try {
    await syncInstallationRepositories(normalizedInstallationId);
    request.log.info({
      event: 'installation.repositories.auto_synced',
      installationId: normalizedInstallationId,
    });
  } catch (error) {
    request.log.error(
      {
        event: 'installation.repositories.auto_sync_failed',
        installationId: normalizedInstallationId,
        error,
      },
      'Automatic repository sync after installation callback failed',
    );
  }

  const redirectUrl = new URL('/onboarding', env.FRONTEND_URL);
  redirectUrl.searchParams.set('installed', '1');

  reply.redirect(redirectUrl.toString());
}

