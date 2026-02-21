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

