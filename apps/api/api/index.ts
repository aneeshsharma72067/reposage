import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from '../src/app';

let appPromise: Promise<Awaited<ReturnType<typeof buildApp>>> | undefined;

async function getApp() {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }

  return appPromise;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const app = await getApp();

  app.server.emit('request', req, res);
}

