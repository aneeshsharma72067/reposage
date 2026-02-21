import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../middleware/requireAuth';
import {
  installationCallback,
  startInstallation,
} from './installation.controller';

const installationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', {
    preHandler: requireAuth,
    schema: {
      tags: ['Installation'],
      summary: 'Start GitHub App installation flow',
      description: 'Redirects authenticated users to GitHub App install page.',
      security: [{ cookieAuth: [] }],
      response: {
        302: {
          description: 'Redirect to GitHub App installation URL',
          headers: {
            location: {
              description: 'GitHub App installation URL',
              schema: { type: 'string', format: 'uri' },
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
    handler: startInstallation,
  });

  app.get('/callback', {
    preHandler: requireAuth,
    schema: {
      tags: ['Installation'],
      summary: 'Handle GitHub App installation callback',
      description:
        'Links installation_id to authenticated user and redirects to frontend.',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        required: ['installation_id'],
        properties: {
          installation_id: { type: 'string', minLength: 1 },
        },
      },
      response: {
        302: {
          description: 'Redirect to frontend URL',
          headers: {
            location: {
              description: 'Frontend URL',
              schema: { type: 'string', format: 'uri' },
            },
          },
        },
        400: {
          description: 'Missing or invalid installation_id',
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: { type: 'string', example: 'INSTALLATION_ID_MISSING' },
            message: { type: 'string' },
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
    handler: installationCallback,
  });
};

export default installationRoutes;

