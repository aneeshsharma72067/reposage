import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../middleware/requireAuth';
import {
  getAnalysisRunById,
  getAnalysisRuns,
  getRepositoryFindings,
} from './analysis.controller';

const analysisRoutes: FastifyPluginAsync = async (app) => {
  app.get('/analysis-runs/:analysisRunId', {
    preHandler: requireAuth,
    schema: {
      tags: ['Analysis'],
      summary: 'Get analysis run by ID',
      description:
        'Returns a single analysis run with repository, source event, and findings for the authenticated user.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['analysisRunId'],
        properties: {
          analysisRunId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          required: [
            'id',
            'status',
            'createdAt',
            'startedAt',
            'completedAt',
            'errorMessage',
            'repository',
            'event',
            'findings',
          ],
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
            startedAt: { type: ['string', 'null'] },
            completedAt: { type: ['string', 'null'] },
            errorMessage: { type: ['string', 'null'] },
            repository: {
              type: 'object',
              required: [
                'id',
                'name',
                'fullName',
                'status',
                'isActive',
                'private',
              ],
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                fullName: { type: 'string' },
                status: { type: 'string' },
                isActive: { type: 'boolean' },
                defaultBranch: { type: ['string', 'null'] },
                private: { type: 'boolean' },
              },
            },
            event: {
              type: 'object',
              required: [
                'id',
                'type',
                'githubEventId',
                'processed',
                'createdAt',
                'payload',
              ],
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                githubEventId: { type: ['string', 'null'] },
                processed: { type: 'boolean' },
                createdAt: { type: 'string' },
                payload: {},
              },
            },
            findings: {
              type: 'array',
              items: {
                type: 'object',
                required: [
                  'id',
                  'repositoryId',
                  'type',
                  'severity',
                  'title',
                  'description',
                  'createdAt',
                ],
                properties: {
                  id: { type: 'string' },
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
          description: 'Analysis run not found',
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: { type: 'string', example: 'ANALYSIS_RUN_NOT_FOUND' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: getAnalysisRunById,
  });

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

  app.get('/:repositoryId/findings', {
    preHandler: requireAuth,
    schema: {
      tags: ['Analysis'],
      summary: 'List repository findings',
      description:
        'Returns the latest 20 findings for a repository owned by the authenticated user.',
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
            required: [
              'id',
              'type',
              'severity',
              'title',
              'description',
              'createdAt',
              'analysisRun',
            ],
            properties: {
              id: { type: 'string' },
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
              analysisRun: {
                type: 'object',
                required: ['id', 'status'],
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  startedAt: { type: ['string', 'null'] },
                  completedAt: { type: ['string', 'null'] },
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
    handler: getRepositoryFindings,
  });
};

export default analysisRoutes;

