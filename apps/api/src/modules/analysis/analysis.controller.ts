import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../utils/errors';
import { listAnalysisRunsForRepository } from './analysis.service';

export async function getAnalysisRuns(
  request: FastifyRequest<{ Params: { repositoryId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.currentUser) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const runs = await listAnalysisRunsForRepository(
    request.params.repositoryId,
    request.currentUser.id,
  );

  reply.send(runs);
}

