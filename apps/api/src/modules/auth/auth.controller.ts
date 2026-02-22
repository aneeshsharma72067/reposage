import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env';
import { AppError } from '../../utils/errors';
import {
  exchangeCodeForAccessToken,
  fetchGithubUserProfile,
  getGithubAuthorizeUrl,
  signSessionToken,
  upsertGithubUser,
} from './auth.service';
import type { GithubCallbackQuery } from './auth.types';

export async function redirectToGithubAuth(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authorizeUrl = getGithubAuthorizeUrl();
  return reply.redirect(authorizeUrl);
}

export async function githubAuthCallback(
  request: FastifyRequest<{ Querystring: GithubCallbackQuery }>,
  reply: FastifyReply,
): Promise<void> {
  const { code } = request.query;

  if (!code) {
    throw new AppError('Missing OAuth code', 400, 'OAUTH_CODE_MISSING');
  }

  const accessToken = await exchangeCodeForAccessToken(code);
  const githubProfile = await fetchGithubUserProfile(accessToken);
  const user = await upsertGithubUser(githubProfile);
  const sessionToken = await signSessionToken(reply, user);
  const redirectUrl = new URL('/login', env.FRONTEND_URL);
  redirectUrl.hash = `access_token=${encodeURIComponent(sessionToken)}`;

  return reply.redirect(redirectUrl.toString());
}

