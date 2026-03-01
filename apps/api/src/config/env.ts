import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotEnv } from 'dotenv';
import { z } from 'zod';

const envCandidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'apps/api/.env'),
  resolve(process.cwd(), '../../.env'),
];

for (const envPath of new Set(envCandidates)) {
  if (existsSync(envPath)) {
    loadDotEnv({ path: envPath, override: false });
  }
}

const envSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_CALLBACK_URL: z.string().url(),
  GITHUB_APP_SLUG: z.string().min(1),
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_APP_PRIVATE_KEY_PATH: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

const parsedEnv = envSchema.safeParse(process.env);
console.log('loaded github callback url :', process.env.GITHUB_CALLBACK_URL);
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

