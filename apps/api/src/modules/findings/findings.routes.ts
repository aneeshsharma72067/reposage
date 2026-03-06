import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../middleware/requireAuth';
import { getFindings } from './findings.controller';

const findingsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', {
    preHandler: requireAuth,
    schema: {
      tags: ['Findings'],
      summary: 'List findings across repositories',
      description:
        'Returns the latest findings from repositories owned by the authenticated user.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            required: [
              'id',
              'analysisRunId',
              'repositoryId',
              'type',
              'severity',
              'title',
              'description',
              'createdAt',
            ],
            properties: {
              id: { type: 'string' },
              analysisRunId: { type: 'string' },
              repositoryId: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              metadata: {
                type: [
                  'object',
                  'array',
                  'string',
                  'number',
                  'boolean',
                  'null',
                ],
              },
              createdAt: { type: 'string' },
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
    handler: getFindings,
  });
};

export default findingsRoutes;

