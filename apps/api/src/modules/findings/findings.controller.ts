import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../utils/errors';
import { getFindingByIdForUser, listFindingsForUser } from './findings.service';

export async function getFindings(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.currentUser) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const findings = await listFindingsForUser(request.currentUser.id);

  reply.send(findings);
}

export async function getFindingById(
  request: FastifyRequest<{ Params: { findingId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!request.currentUser) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const finding = await getFindingByIdForUser(
    request.currentUser.id,
    request.params.findingId,
  );

  reply.send(finding);
}

