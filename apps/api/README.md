# API Service

Fastify backend application.

## Deploy To Vercel

This API is configured to run on Vercel as a single Node.js serverless function via [api/index.ts](api/index.ts).

### 1. Set Project Root

When creating the Vercel project, set the root directory to [apps/api](apps/api).

### 2. Required Environment Variables

Configure these variables in the Vercel project settings:

- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- GITHUB_CALLBACK_URL
- GITHUB_APP_SLUG
- GITHUB_APP_ID
- GITHUB_APP_PRIVATE_KEY
- JWT_SECRET
- DATABASE_URL
- REDIS_URL
- FRONTEND_URL
- GEMINI_API_KEY
- GEMINI_MODEL (optional)
- NODE_ENV=production

Use GITHUB_APP_PRIVATE_KEY in Vercel. Do not use GITHUB_APP_PRIVATE_KEY_PATH in Vercel unless you intentionally package a key file.

### 3. Routing Behavior

All incoming paths are routed to the Fastify app using [vercel.json](vercel.json), so existing routes keep working:

- /auth/\*
- /repos/\*
- /events/\*
- /webhooks/\*
- /findings/\*

### 4. Important Runtime Note

This API enqueues analysis jobs in Redis/BullMQ. The queue worker is not hosted on Vercel by this setup.

Deploy and run [workers/analyzer](../../workers/analyzer) separately so queued jobs are processed.
