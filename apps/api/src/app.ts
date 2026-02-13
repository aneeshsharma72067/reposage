import Fastify from 'fastify';
import authRoutes from './modules/auth/auth.routes';
import { jwtPlugin } from './plugins/jwt';
import { registerErrorHandler } from './utils/errors';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  registerErrorHandler(app);

  app.register(jwtPlugin);
  app.register(authRoutes, { prefix: '/auth' });

  return app;
}

