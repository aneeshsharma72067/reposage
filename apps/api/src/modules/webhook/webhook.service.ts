import type { FastifyBaseLogger } from 'fastify';
import { prisma } from '../../lib/prisma';
import type { GithubWebhookPayload } from './webhook.types';

interface HandleGithubWebhookEventInput {
  event: string;
  payload: GithubWebhookPayload;
  logger: FastifyBaseLogger;
}

function isValidInstallationCreatedPayload(
  payload: GithubWebhookPayload,
): payload is GithubWebhookPayload & {
  action: 'created';
  installation: {
    id: number;
    account: {
      login: string;
      type: string;
    };
  };
} {
  return (
    payload.action === 'created' &&
    typeof payload.installation?.id === 'number' &&
    typeof payload.installation.account?.login === 'string' &&
    typeof payload.installation.account?.type === 'string'
  );
}

export async function handleGithubWebhookEvent({
  event,
  payload,
  logger,
}: HandleGithubWebhookEventInput): Promise<void> {
  if (event !== 'installation') {
    return;
  }

  if (payload.action !== 'created') {
    return;
  }

  if (!isValidInstallationCreatedPayload(payload)) {
    logger.warn(
      {
        event: 'installation.created',
      },
      'Ignoring invalid installation.created payload',
    );

    return;
  }

  const installationId = payload.installation.id;
  const accountLogin = payload.installation.account.login;
  const accountType = payload.installation.account.type;

  const user = await prisma.user.findFirst({
    where: {
      githubLogin: accountLogin,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    logger.warn(
      {
        event: 'installation.created',
        installationId,
        account: accountLogin,
      },
      'No user found for GitHub installation account login',
    );

    return;
  }

  await prisma.githubInstallation.upsert({
    where: {
      installationId: BigInt(installationId),
    },
    update: {
      accountLogin,
      accountType,
      installedByUserId: user.id,
    },
    create: {
      installationId: BigInt(installationId),
      accountLogin,
      accountType,
      installedByUserId: user.id,
    },
  });

  logger.info(
    {
      event: 'installation.created',
      installationId,
      account: accountLogin,
      linkedUserId: user.id,
    },
    'GitHub installation persisted',
  );
}

