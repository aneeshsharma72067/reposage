'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.isProduction = exports.env = void 0;
var zod_1 = require('zod');
var envSchema = zod_1.z.object({
  GITHUB_CLIENT_ID: zod_1.z.string().min(1),
  GITHUB_CLIENT_SECRET: zod_1.z.string().min(1),
  GITHUB_CALLBACK_URL: zod_1.z.string().url(),
  GITHUB_APP_SLUG: zod_1.z.string().min(1),
  JWT_SECRET: zod_1.z.string().min(32),
  DATABASE_URL: zod_1.z.string().min(1),
  FRONTEND_URL: zod_1.z.string().url(),
  NODE_ENV: zod_1.z
    .enum(['development', 'test', 'production'])
    .default('development'),
});
var parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  var issues = parsedEnv.error.issues
    .map(function (issue) {
      return ''.concat(issue.path.join('.'), ': ').concat(issue.message);
    })
    .join(', ');
  throw new Error('Invalid environment configuration: '.concat(issues));
}
exports.env = parsedEnv.data;
exports.isProduction = exports.env.NODE_ENV === 'production';

