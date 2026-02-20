import type { FastifyPluginAsync } from 'fastify';
import { githubWebhookReceiver } from './webhook.controller';

const webhookRoutes: FastifyPluginAsync = async (app) => {
  app.post('/github', {
    schema: {
      tags: ['Webhooks'],
      summary: 'GitHub webhook receiver',
      description:
        'Receives GitHub webhook events for installation delivery testing.',
      body: {
        type: 'object',
        additionalProperties: true,
      },
      response: {
        200: {
          description: 'Webhook payload received',
          type: 'object',
          required: ['received'],
          properties: {
            received: { type: 'boolean', const: true },
          },
        },
      },
    },
    handler: githubWebhookReceiver,
  });
};

export default webhookRoutes;

