import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  GithubWebhookHeaders,
  GithubWebhookPayload,
} from './webhook.types';

function getFirstHeaderValue(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getPayloadType(payload: unknown): 'array' | 'null' | string {
  if (Array.isArray(payload)) {
    return 'array';
  }

  if (payload === null) {
    return 'null';
  }

  return typeof payload;
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
  console.log('Received GitHub webhook:', {
    event,
    deliveryId,
    payloadType: getPayloadType(payload),
    action:
      payload && typeof payload === 'object' && 'action' in payload
        ? (payload.action ?? null)
        : null,
    body: payload,
  });
  request.log.info(
    {
      event,
      deliveryId,
      payloadType: getPayloadType(payload),
      action:
        payload && typeof payload === 'object' && 'action' in payload
          ? (payload.action ?? null)
          : null,
      body: payload,
    },
    'GitHub webhook received',
  );

  return reply.status(200).send({ received: true });
}

