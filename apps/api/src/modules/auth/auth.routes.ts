import type { FastifyPluginAsync } from 'fastify';
import { githubAuthCallback, redirectToGithubAuth } from './auth.controller';

const authRoutes: FastifyPluginAsync = async (app) => {
  app.get('/github', {
    schema: {
      tags: ['Auth'],
      summary: 'Start GitHub OAuth flow',
      description: 'Redirects the user to GitHub OAuth authorization page.',
      response: {
        302: {
          description: 'Redirect to GitHub authorization URL',
          headers: {
            location: {
              description: 'GitHub OAuth authorize URL',
              schema: { type: 'string', format: 'uri' },
            },
          },
        },
      },
    },
    handler: redirectToGithubAuth,
  });

  app.get('/github/callback', {
    schema: {
      tags: ['Auth'],
      summary: 'Handle GitHub OAuth callback',
      description:
        'Exchanges OAuth code, upserts user, sets session cookie, then redirects to frontend.',
      querystring: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', minLength: 1 },
        },
      },
      response: {
        302: {
          description: 'Session established and redirected to frontend URL',
          headers: {
            location: {
              description: 'Frontend URL',
              schema: { type: 'string', format: 'uri' },
            },
            'set-cookie': {
              description: 'HTTP-only session cookie',
              schema: { type: 'string' },
            },
          },
        },
        400: {
          description: 'Missing OAuth code',
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: { type: 'string', example: 'OAUTH_CODE_MISSING' },
            message: { type: 'string', example: 'Missing OAuth code' },
          },
        },
        401: {
          description: 'Invalid or expired OAuth code',
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: { type: 'string', example: 'INVALID_GITHUB_OAUTH_CODE' },
            message: { type: 'string' },
          },
        },
        502: {
          description: 'Upstream GitHub OAuth/profile failure',
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: {
              type: 'string',
              example: 'GITHUB_OAUTH_FAILED',
            },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: githubAuthCallback,
  });
};

export default authRoutes;

