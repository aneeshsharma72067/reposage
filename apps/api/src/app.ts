import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

import authRoutes from './modules/auth/auth.routes';
import { jwtPlugin } from './plugins/jwt';
import { registerErrorHandler } from './utils/errors';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  registerErrorHandler(app);

  // Swagger only in development
  if (process.env.NODE_ENV !== 'production') {
    await app.register(swagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'RepoSage API',
          description: 'Backend API documentation for RepoSage',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'http://localhost:3000',
          },
        ],
      },
    });

    await app.register(swaggerUI, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });
  }

  await app.register(jwtPlugin);
  await app.register(authRoutes, { prefix: '/auth' });

  return app;
}

