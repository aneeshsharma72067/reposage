import type { FastifyPluginAsync } from 'fastify';
import jwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import { env } from '../config/env';

const jwtPluginImpl: FastifyPluginAsync = async (app) => {
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: '7d',
    },
  });
};

export const jwtPlugin = fp(jwtPluginImpl, {
  name: 'jwt-plugin',
});

