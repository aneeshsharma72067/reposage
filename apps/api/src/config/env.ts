import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotEnv } from 'dotenv';
import { z } from 'zod';

const requiredEnvKeys = [
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_CALLBACK_URL',
  'GITHUB_APP_SLUG',
  'GITHUB_APP_ID',
  'JWT_SECRET',
  'DATABASE_URL',
  'REDIS_URL',
  'FRONTEND_URL',
  'GEMINI_API_KEY',
] as const;

function hasEnvValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasRequiredRuntimeEnv(): boolean {
  const hasAllRequired = requiredEnvKeys.every((key) =>
    hasEnvValue(process.env[key]),
  );
  const hasGithubPrivateKey =
    hasEnvValue(process.env.GITHUB_APP_PRIVATE_KEY) ||
    hasEnvValue(process.env.GITHUB_APP_PRIVATE_KEY_PATH);

  return hasAllRequired && hasGithubPrivateKey;
}

const isLocalDevelopment =
  (process.env.NODE_ENV ?? 'development') !== 'production';

if (isLocalDevelopment && !hasRequiredRuntimeEnv()) {
  const envCandidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'apps/api/.env'),
    resolve(process.cwd(), '../apps/api/.env'),
    resolve(process.cwd(), '../../apps/api/.env'),
    resolve(process.cwd(), '../../../apps/api/.env'),
    resolve(process.cwd(), '../.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(process.cwd(), '../../../.env'),
  ];

  for (const envPath of new Set(envCandidates)) {
    if (existsSync(envPath)) {
      loadDotEnv({ path: envPath, override: false });

      if (hasRequiredRuntimeEnv()) {
        break;
      }
    }
  }
}

const envSchema = z
  .object({
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_CALLBACK_URL: z.string().url(),
    GITHUB_APP_SLUG: z.string().min(1),
    GITHUB_APP_ID: z.string().min(1),
    GITHUB_APP_PRIVATE_KEY_PATH: z.string().min(1).optional(),
    GITHUB_APP_PRIVATE_KEY: z.string().min(1).optional(),
    JWT_SECRET: z.string().min(32),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    FRONTEND_URL: z.string().url(),
    GEMINI_API_KEY: z.string().min(1),
    GEMINI_MODEL: z.string().min(1).optional(),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  })
  .superRefine((value, context) => {
    if (!value.GITHUB_APP_PRIVATE_KEY && !value.GITHUB_APP_PRIVATE_KEY_PATH) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GITHUB_APP_PRIVATE_KEY'],
        message:
          'Either GITHUB_APP_PRIVATE_KEY or GITHUB_APP_PRIVATE_KEY_PATH must be set',
      });
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
  throw new Error(
    `Invalid environment configuration: ${issues}. Create apps/api/.env from apps/api/.env.example.`,
  );
}

export const env = parsedEnv.data;
export const isProduction = env.NODE_ENV === 'production';

