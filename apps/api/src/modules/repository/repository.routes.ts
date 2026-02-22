import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../middleware/requireAuth';
import { listRepositories } from './repository.controller';

const repositoryRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', {
    preHandler: requireAuth,
    schema: {
      tags: ['Repositories'],
      summary: 'List repositories for authenticated user',
      description:
        'Returns repositories linked to GitHub installations owned by the authenticated user.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            required: [
              'id',
              'githubRepoId',
              'name',
              'fullName',
              'private',
              'defaultBranch',
              'installationId',
              'isActive',
            ],
            properties: {
              id: { type: 'string' },
              githubRepoId: { type: 'string' },
              name: { type: 'string' },
              fullName: { type: 'string' },
              private: { type: 'boolean' },
              defaultBranch: { type: 'string' },
              installationId: { type: 'string' },
              isActive: { type: 'boolean' },
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
    handler: listRepositories,
  });
};

export default repositoryRoutes;

