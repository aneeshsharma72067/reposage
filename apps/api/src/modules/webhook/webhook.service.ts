import type { FastifyBaseLogger } from 'fastify';
import { triggerAnalysisFromPushEvent } from '../analysis/analysis.service';
import type { GitHubPushPayload } from '../analysis/analysis.types';
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
  if (event === 'push') {
    await triggerAnalysisFromPushEvent({
      payload: payload as unknown as GitHubPushPayload,
      logger,
    });
    return;
  }

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

  logger.info(
    {
      event: 'installation.created',
      installationId,
      account: accountLogin,
      accountType,
    },
    'GitHub installation.created webhook received',
  );
}

