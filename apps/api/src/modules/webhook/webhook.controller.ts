import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  GithubWebhookHeaders,
  GithubWebhookPayload,
} from './webhook.types';
import { handleGithubWebhookEvent } from './webhook.service';

function getFirstHeaderValue(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export async function githubWebhookReceiver(
  request: FastifyRequest<{
    Headers: GithubWebhookHeaders;
    Body: GithubWebhookPayload;
  }>,
  reply: FastifyReply,
): Promise<{ received: true }> {
  const event =
    getFirstHeaderValue(request.headers['x-github-event']) ?? 'unknown';
  const deliveryId =
    getFirstHeaderValue(request.headers['x-github-delivery']) ?? 'unknown';
  const payload = request.body;

  try {
    await handleGithubWebhookEvent({
      event,
      payload,
      logger: request.log,
    });
  } catch (error) {
    request.log.error(
      {
        err: error,
        event,
        deliveryId,
      },
      'Failed to process GitHub webhook event',
    );
  }

  return reply.status(200).send({ received: true });
}

