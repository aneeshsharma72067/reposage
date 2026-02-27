import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../middleware/requireAuth';
import { getEventById, listEvents } from './event.controller';

const eventRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', {
    preHandler: requireAuth,
    schema: {
      tags: ['Events'],
      summary: 'List events for authenticated user',
      description:
        'Returns the latest 50 events across all repositories owned by the authenticated user.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            required: [
              'id',
              'repositoryId',
              'repositoryName',
              'type',
              'processed',
              'createdAt',
            ],
            properties: {
              id: { type: 'string' },
              repositoryId: { type: 'string' },
              repositoryName: { type: 'string' },
              githubEventId: { type: ['string', 'null'] },
              type: { type: 'string' },
              processed: { type: 'boolean' },
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
    handler: listEvents,
  });

  app.get('/:eventId', {
    preHandler: requireAuth,
    schema: {
      tags: ['Events'],
      summary: 'Get event by ID',
      description:
        'Returns a single event with its payload and associated analysis runs.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['eventId'],
        properties: {
          eventId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          required: [
            'id',
            'repositoryId',
            'repositoryName',
            'type',
            'payload',
            'processed',
            'createdAt',
            'analysisRuns',
          ],
          properties: {
            id: { type: 'string' },
            repositoryId: { type: 'string' },
            repositoryName: { type: 'string' },
            githubEventId: { type: ['string', 'null'] },
            type: { type: 'string' },
            payload: {},
            processed: { type: 'boolean' },
            createdAt: { type: 'string' },
            analysisRuns: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'status'],
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  startedAt: { type: ['string', 'null'] },
                  completedAt: { type: ['string', 'null'] },
                  errorMessage: { type: ['string', 'null'] },
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
          description: 'Event not found',
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: { type: 'string', example: 'EVENT_NOT_FOUND' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: getEventById,
  });
};

export default eventRoutes;

