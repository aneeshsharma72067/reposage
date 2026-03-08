import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/requireAuth';
import { resyncRepositories } from '../../modules/repository/repository.controller';

export function registerResyncRepositoryRoute(app: FastifyInstance): void {
  app.post('/resync', {
    preHandler: requireAuth,
    schema: {
      tags: ['Repositories'],
      summary: 'Manually resync GitHub repositories',
      description:
        'Fetches repositories for the authenticated user GitHub installation(s) and upserts them in the database.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          required: ['synced'],
          properties: {
            synced: { type: 'number' },
          },
        },
        401: {
          description: 'Unauthorized request',
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: { type: 'string', example: 'UNAUTHORIZED' },
            message: { type: 'string' },
          },
        },
        404: {
          description: 'GitHub installation missing for user',
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: { type: 'string', example: 'INSTALLATION_NOT_FOUND' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: resyncRepositories,
  });
}

