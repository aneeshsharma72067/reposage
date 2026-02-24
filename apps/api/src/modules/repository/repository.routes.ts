import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../middleware/requireAuth';
import {
  getRepositoryDetails,
  listRepositories,
} from './repository.controller';

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

  app.get('/:repoId/details', {
    preHandler: requireAuth,
    schema: {
      tags: ['Repositories'],
      summary: 'Get repository details from GitHub',
      description:
        'Returns enriched repository details from GitHub API for a repository linked to the authenticated user.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['repoId'],
        properties: {
          repoId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          required: [
            'id',
            'githubRepoId',
            'name',
            'fullName',
            'private',
            'isActive',
            'htmlUrl',
            'defaultBranch',
            'topics',
            'stargazersCount',
            'watchersCount',
            'forksCount',
            'openIssuesCount',
            'subscribersCount',
            'size',
            'archived',
            'disabled',
            'visibility',
            'recentCommits',
          ],
          properties: {
            id: { type: 'string' },
            githubRepoId: { type: 'string' },
            name: { type: 'string' },
            fullName: { type: 'string' },
            private: { type: 'boolean' },
            isActive: { type: 'boolean' },
            htmlUrl: { type: 'string' },
            description: { type: ['string', 'null'] },
            homepage: { type: ['string', 'null'] },
            defaultBranch: { type: 'string' },
            language: { type: ['string', 'null'] },
            topics: { type: 'array', items: { type: 'string' } },
            stargazersCount: { type: 'number' },
            watchersCount: { type: 'number' },
            forksCount: { type: 'number' },
            openIssuesCount: { type: 'number' },
            subscribersCount: { type: 'number' },
            size: { type: 'number' },
            archived: { type: 'boolean' },
            disabled: { type: 'boolean' },
            visibility: { type: 'string' },
            licenseName: { type: ['string', 'null'] },
            pushedAt: { type: ['string', 'null'] },
            updatedAt: { type: ['string', 'null'] },
            createdAt: { type: ['string', 'null'] },
            recentCommits: {
              type: 'array',
              items: {
                type: 'object',
                required: ['sha', 'message', 'authorName', 'authoredAt', 'url'],
                properties: {
                  sha: { type: 'string' },
                  message: { type: 'string' },
                  authorName: { type: ['string', 'null'] },
                  authoredAt: { type: ['string', 'null'] },
                  url: { type: 'string' },
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
        404: {
          description: 'Repository not found',
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: { type: 'string', example: 'REPOSITORY_NOT_FOUND' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: getRepositoryDetails,
  });
};

export default repositoryRoutes;

