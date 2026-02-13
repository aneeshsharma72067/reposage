import { z } from 'zod';

const envSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_CALLBACK_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = parsedEnv.data;
export const isProduction = env.NODE_ENV === 'production';

