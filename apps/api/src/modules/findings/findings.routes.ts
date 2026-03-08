import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../middleware/requireAuth';
import { getFindingById, getFindings } from './findings.controller';

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
              metadata: {},
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

  app.get('/:findingId', {
    preHandler: requireAuth,
    schema: {
      tags: ['Findings'],
      summary: 'Get finding by ID',
      description:
        'Returns a single finding with repository and analysis run details for the authenticated user.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['findingId'],
        properties: {
          findingId: { type: 'string' },
        },
      },
      response: {
        200: {
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
            'repository',
            'analysisRun',
          ],
          properties: {
            id: { type: 'string' },
            analysisRunId: { type: 'string' },
            repositoryId: { type: 'string' },
            type: { type: 'string' },
            severity: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            metadata: {},
            createdAt: { type: 'string' },
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
            analysisRun: {
              type: 'object',
              required: [
                'id',
                'status',
                'createdAt',
                'startedAt',
                'completedAt',
                'errorMessage',
                'event',
              ],
              properties: {
                id: { type: 'string' },
                status: { type: 'string' },
                createdAt: { type: 'string' },
                startedAt: { type: ['string', 'null'] },
                completedAt: { type: ['string', 'null'] },
                errorMessage: { type: ['string', 'null'] },
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
          description: 'Finding not found',
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: { type: 'string', example: 'FINDING_NOT_FOUND' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: getFindingById,
  });
};

export default findingsRoutes;

