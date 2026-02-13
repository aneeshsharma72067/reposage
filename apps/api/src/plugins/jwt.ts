import type { FastifyPluginAsync } from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { env } from '../config/env';

export const SESSION_COOKIE_NAME = 'ae_session';

export const jwtPlugin: FastifyPluginAsync = async (app) => {
  await app.register(cookie, {
    hook: 'onRequest',
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: SESSION_COOKIE_NAME,
      signed: false,
    },
    sign: {
      expiresIn: '7d',
    },
  });
};

