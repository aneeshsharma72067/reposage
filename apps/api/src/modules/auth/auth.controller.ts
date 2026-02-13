import type { FastifyReply, FastifyRequest } from 'fastify';
import { env, isProduction } from '../../config/env';
import { SESSION_COOKIE_NAME } from '../../plugins/jwt';
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

  reply.setCookie(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return reply.redirect(env.FRONTEND_URL);
}

