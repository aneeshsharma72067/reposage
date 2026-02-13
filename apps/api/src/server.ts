import { env } from './config/env';
import { buildApp } from './app';

async function start() {
  const app = buildApp();

  try {
    await app.listen({
      host: '0.0.0.0',
      port: 3000,
    });

    app.log.info(` -- API server listening in ${env.NODE_ENV} mode`);
  } catch (error) {
    app.log.error(error, 'Failed to start API server');
    process.exit(1);
  }
}

void start();
