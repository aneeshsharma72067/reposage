import type { IncomingMessage, ServerResponse } from 'node:http';

type FastifyApp = Awaited<
  ReturnType<(typeof import('../src/app'))['buildApp']>
>;

let appPromise: Promise<FastifyApp> | undefined;

async function loadAppFactory() {
  const module = await import('../src/app.js');
  return module.buildApp;
}

async function getApp() {
  if (!appPromise) {
    appPromise = loadAppFactory()
      .then((buildApp) => buildApp())
      .then(async (app) => {
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
  try {
    const app = await getApp();
    app.server.emit('request', req, res);
  } catch (error) {
    console.error('Serverless bootstrap failed', error);

    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'API bootstrap failed' }));
  }
}

