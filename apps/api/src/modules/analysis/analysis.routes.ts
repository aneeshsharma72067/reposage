import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../middleware/requireAuth';
import { getAnalysisRuns } from './analysis.controller';

const analysisRoutes: FastifyPluginAsync = async (app) => {
  app.get('/:repositoryId/analysis-runs', {
    preHandler: requireAuth,
    schema: {
      tags: ['Analysis'],
      summary: 'List analysis runs for a repository',
      description:
        'Returns the latest 5 analysis runs for a repository owned by the authenticated user.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['repositoryId'],
        properties: {
          repositoryId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'status', 'event'],
            properties: {
              id: { type: 'string' },
              status: { type: 'string' },
              startedAt: { type: ['string', 'null'] },
              completedAt: { type: ['string', 'null'] },
              errorMessage: { type: ['string', 'null'] },
              event: {
                type: 'object',
                required: ['id', 'type', 'createdAt'],
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  githubEventId: { type: ['string', 'null'] },
                  createdAt: { type: 'string' },
                },
              },
            },
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
      },
    },
    handler: getAnalysisRuns,
  });
};

export default analysisRoutes;

