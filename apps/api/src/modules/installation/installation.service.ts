import type { FastifyBaseLogger } from 'fastify';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import type { LinkInstallationInput } from './installation.types';

function parseInstallationId(installationId: string): bigint {
  if (!/^\d+$/.test(installationId)) {
    throw new AppError(
      'Invalid installation_id query parameter',
      400,
      'INSTALLATION_ID_INVALID',
    );
  }

  return BigInt(installationId);
}

export function getGithubAppInstallationUrl(): string {
  return `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new`;
}

export function getGithubAppInstallationUrlWithState(state: string): string {
  const installUrl = new URL(
    `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new`,
  );

  installUrl.searchParams.set('state', state);
  return installUrl.toString();
}

export async function linkInstallationToUser(
  input: LinkInstallationInput,
  logger: FastifyBaseLogger,
): Promise<void> {
  const normalizedInstallationId = parseInstallationId(input.installationId);

  await prisma.githubInstallation.upsert({
    where: {
      installationId: normalizedInstallationId,
    },
    update: {
      installedByUserId: input.user.id,
      accountLogin: input.user.githubLogin,
      accountType: 'User',
    },
    create: {
      installationId: normalizedInstallationId,
      installedByUserId: input.user.id,
      accountLogin: input.user.githubLogin,
      accountType: 'User',
    },
  });

  logger.info(
    {
      event: 'installation.callback.linked',
      installationId: input.installationId,
      linkedUserId: input.user.id,
    },
    'GitHub App installation linked to user',
  );
}

