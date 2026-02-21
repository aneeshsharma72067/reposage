## Phase 2 - Webhook Scaffold

- Added GitHub webhook endpoint
- Structured webhook module
- Integrated Swagger schema
- Logging GitHub event metadata

## Phase 2.3 - Installation Persistence

- Persist installation.created events
- Linked installation to user
- Added installation service logic

## Phase 2.4 - Installation Redirect Flow

- Added protected `GET /install` route to redirect users to GitHub App installation page
- Added protected `GET /install/callback` route to link `installation_id` to authenticated user
- Created dedicated installation module with route, controller, service, and types
- Added `GITHUB_APP_SLUG` environment configuration
- Simplified webhook installation handling to log-only (no user matching or linking)

## Phase 2.4.1 - Auth Fix

- Fixed requireAuth middleware for cookie-based sessions
- Ensured JWT is correctly read from cookies
- Resolved UNAUTHORIZED error on /install route
- Verified installation redirect flow works under ngrok domain

## Phase 3.1 - GitHub App JWT Generation

- Added `modules/githubApp/githubApp.service.ts` with `generateAppJwt()`
- Added `modules/githubApp/githubApp.types.ts` for JWT payload/config typing
- Implemented RS256 JWT signing using `jose` and `importPKCS8`
- Added structured `AppError` handling for missing config, key file not found, read failures, and invalid key format
- Added safe debug logging for JWT generation without logging private key or token value
- Extended API environment schema with `GITHUB_APP_ID` and `GITHUB_APP_PRIVATE_KEY_PATH`

## Phase 3.2 - Installation Access Token

- Implemented exchange of App JWT for installation access token
- Added GitHub App service method
- Added debug route for token validation

## Phase 3.3 - Installation Repository Sync

- Added `syncInstallationRepositories(installationId)` in GitHub App service
- Fetches repositories from `GET /installation/repositories` using installation access token
- Persists repositories via Prisma upsert with installation linkage
- Stores repository metadata: `githubRepoId`, `name`, `fullName`, `private`, `defaultBranch`, `ownerLogin`, `ownerType`
- Added temporary debug endpoint: `POST /debug/sync-repos/:installationId`
- Added schema/migration updates for new repository metadata fields

## Phase 3.4 - Automatic Repository Sync

- Trigger repository sync during installation callback
- Removed manual debug sync route
- Installation now auto-discovers repositories

