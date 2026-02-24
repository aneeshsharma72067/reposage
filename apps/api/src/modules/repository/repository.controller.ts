import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../utils/errors';
import {
  getRepositoryDetailsForUser,
  listRepositoriesForUser,
} from './repository.service';

export async function listRepositories(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.currentUser) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const repositories = await listRepositoriesForUser(request.currentUser.id);

  reply.send(repositories);
}

export async function getRepositoryDetails(
  request: FastifyRequest<{ Params: { repoId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.currentUser) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const details = await getRepositoryDetailsForUser(
    request.currentUser.id,
    request.params.repoId,
  );

  reply.send(details);
}

