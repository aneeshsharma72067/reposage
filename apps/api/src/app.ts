import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { env } from './config/env';

import authRoutes from './modules/auth/auth.routes';
import {
  generateAppJwt,
  generateInstallationAccessToken,
} from './modules/githubApp/githubApp.service';
import installationRoutes from './modules/installation/installation.routes';
import analysisRoutes from './modules/analysis/analysis.routes';
import eventRoutes from './modules/event/event.routes';
import repositoryRoutes from './modules/repository/repository.routes';
import webhookRoutes from './modules/webhook/webhook.routes';
import { jwtPlugin } from './plugins/jwt';
import { AppError, registerErrorHandler } from './utils/errors';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  const allowedOrigins = new Set([
    env.FRONTEND_URL,
    'https://lucia-asbestine-deucedly.ngrok-free.dev',
    'http://localhost:8000',
  ]);

  const isAllowedOrigin = (origin: string): boolean => {
    if (allowedOrigins.has(origin)) {
      return true;
    }

    try {
      const parsedOrigin = new URL(origin);
      const isLocalhost =
        parsedOrigin.hostname === 'localhost' ||
        parsedOrigin.hostname === '127.0.0.1';

      if (isLocalhost) {
        return true;
      }

      return parsedOrigin.hostname.endsWith('.ngrok-free.dev');
    } catch {
      return false;
    }
  };

  registerErrorHandler(app);

  await app.register(cors, {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
      'Accept',
      'Origin',
    ],
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  });

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
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
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
  await app.register(analysisRoutes, { prefix: '/repos' });
  await app.register(eventRoutes, { prefix: '/events' });
  await app.register(webhookRoutes, { prefix: '/webhooks' });

  return app;
}

