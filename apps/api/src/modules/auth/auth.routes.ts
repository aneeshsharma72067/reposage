import type { FastifyPluginAsync } from 'fastify';
import { githubAuthCallback, redirectToGithubAuth } from './auth.controller';

const authRoutes: FastifyPluginAsync = async (app) => {
  app.get('/github', redirectToGithubAuth);
  app.get('/github/callback', githubAuthCallback);
};

export default authRoutes;

