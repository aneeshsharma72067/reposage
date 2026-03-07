import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../utils/errors';
import {
  getAnalysisRunByIdForUser,
  listAnalysisRunsForRepository,
  listFindingsForRepository,
} from './analysis.service';

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

export async function getRepositoryFindings(
  request: FastifyRequest<{ Params: { repositoryId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.currentUser) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const findings = await listFindingsForRepository(
    request.params.repositoryId,
    request.currentUser.id,
  );

  reply.send(findings);
}

export async function getAnalysisRunById(
  request: FastifyRequest<{ Params: { analysisRunId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.currentUser) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const run = await getAnalysisRunByIdForUser(
    request.currentUser.id,
    request.params.analysisRunId,
  );

  reply.send(run);
}

