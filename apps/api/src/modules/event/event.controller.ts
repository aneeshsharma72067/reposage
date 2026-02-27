import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../utils/errors';
import { getEventByIdForUser, listEventsForUser } from './event.service';

export async function listEvents(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.currentUser) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const events = await listEventsForUser(request.currentUser.id);

  reply.send(events);
}

export async function getEventById(
  request: FastifyRequest<{ Params: { eventId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.currentUser) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const event = await getEventByIdForUser(
    request.currentUser.id,
    request.params.eventId,
  );

  reply.send(event);
}

