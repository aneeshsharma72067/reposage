import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../middleware/requireAuth';
import {
  getInstallationUrl,
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
      security: [{ bearerAuth: [] }],
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

  app.get('/url', {
    preHandler: requireAuth,
    schema: {
      tags: ['Installation'],
      summary: 'Get GitHub App installation URL',
      description:
        'Returns a GitHub App installation URL containing a signed state token for callback verification.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string', format: 'uri' },
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
    handler: getInstallationUrl,
  });

  app.get('/callback', {
    schema: {
      tags: ['Installation'],
      summary: 'Handle GitHub App installation callback',
      description:
        'Links installation_id to user encoded in signed state token and redirects to frontend.',
      querystring: {
        type: 'object',
        required: ['installation_id', 'state'],
        properties: {
          installation_id: { type: 'string', minLength: 1 },
          state: { type: 'string', minLength: 1 },
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
          description: 'Unauthorized request or state user not found',
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

