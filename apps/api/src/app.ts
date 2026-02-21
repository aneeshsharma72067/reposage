import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

import authRoutes from './modules/auth/auth.routes';
import {
  generateAppJwt,
  generateInstallationAccessToken,
} from './modules/githubApp/githubApp.service';
import installationRoutes from './modules/installation/installation.routes';
import repositoryRoutes from './modules/repository/repository.routes';
import webhookRoutes from './modules/webhook/webhook.routes';
import { jwtPlugin } from './plugins/jwt';
import { AppError, registerErrorHandler } from './utils/errors';

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
        components: {
          securitySchemes: {
            cookieAuth: {
              type: 'apiKey',
              in: 'cookie',
              name: 'ae_session',
            },
          },
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

  app.get('/debug/app-jwt', async () => {
    const token = await generateAppJwt();
    void token;

    return { ok: true };
  });

  app.get('/debug/installation-token/:id', async (request) => {
    const installationIdParam = (request.params as { id?: string }).id;

    if (!installationIdParam || !/^\d+$/.test(installationIdParam)) {
      throw new AppError(
        'Invalid installation id parameter',
        400,
        'INSTALLATION_ID_INVALID',
      );
    }

    const token = await generateInstallationAccessToken(
      BigInt(installationIdParam),
    );
    void token;

    return { ok: true };
  });

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(installationRoutes, { prefix: '/install' });
  await app.register(repositoryRoutes, { prefix: '/repos' });
  await app.register(webhookRoutes, { prefix: '/webhooks' });

  return app;
}

