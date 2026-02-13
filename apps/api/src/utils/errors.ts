import type { FastifyInstance } from 'fastify';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
    }

    request.log.error(error, 'Unhandled request error');

    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  });
}

