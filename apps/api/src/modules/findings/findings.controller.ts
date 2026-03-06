import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../utils/errors';
import { listFindingsForUser } from './findings.service';

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

