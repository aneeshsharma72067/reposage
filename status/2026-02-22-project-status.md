# Project Status — 2026-02-22

## 1) Executive Summary

This status captures what is implemented in code as of **2026-02-22** across API, Web, Worker, Shared packages, and Infra.

Current state:
- Core GitHub auth + app installation + repository sync/listing flow is implemented end-to-end.
- Dashboard and repository detail UI are implemented and wired to available APIs.
- Event-driven AI analysis pipeline (queue + worker processing + findings + realtime updates) is **not implemented yet** beyond scaffolding.

---

## 2) Implemented Architecture (Actual)

### Runtime components currently active
1. **Frontend (`apps/web`)**
   - Next.js App Router app on port `8000`
   - Token-based auth (token in URL hash -> localStorage)
   - Calls backend APIs with `Authorization: Bearer <token>`

2. **Backend API (`apps/api`)**
   - Fastify app on port `3000`
   - CORS configured for localhost/ngrok dev origins
   - GitHub OAuth callback -> JWT issuance -> frontend redirect
   - GitHub App install flow with signed state token
   - Repository sync from GitHub installation API into PostgreSQL
   - Protected endpoint to list user repositories

3. **Database (`PostgreSQL + Prisma`)**
   - Schema for users, installations, repositories, events, analysis runs, findings
   - Migrations exist for initial schema and repository sync metadata fields

### Runtime components defined but not yet functional
4. **Worker (`workers/analyzer`)**
   - Entry file exists, currently only startup log

5. **Internal queue / broker**
   - Not implemented (no Redis queue/Kafka/SQS wiring in code)

6. **Realtime update layer**
   - Not implemented (no websocket/SSE/pubsub path in API/web)

---

## 3) Module-by-Module Build Status

## Root / Monorepo
- `package.json`: workspace orchestration in place
- `README.md`: high-level architecture summary exists
- `DOCUMENTATION.md`: target architecture + MVP phases defined
- `CHANGELOG.md`: records API implementation phases up to repo listing

## apps/api

### Bootstrap & platform
- `src/server.ts`: bootstraps Fastify server (`0.0.0.0:3000`)
- `src/app.ts`:
  - Registers CORS, Swagger, JWT plugin
  - Mounts routes:
    - `/auth`
    - `/install`
    - `/repos`
    - `/webhooks`
  - Includes debug endpoints for GitHub App token generation

### Config
- `src/config/env.ts`:
  - Loads env files from multiple candidate paths
  - Validates required env via Zod
  - Enforces JWT secret length, URLs, GitHub App settings

### Auth module (`src/modules/auth`)
- `GET /auth/github`: redirects to GitHub OAuth authorize URL
- `GET /auth/github/callback`:
  - Exchanges code for access token
  - Fetches GitHub user profile
  - Upserts user in DB
  - Signs app JWT
  - Redirects to frontend `/login#access_token=...`

### JWT/Auth middleware
- `src/plugins/jwt.ts`: configures `@fastify/jwt`
- `src/middleware/requireAuth.ts`: bearer-token verification + user resolution from DB

### Installation module (`src/modules/installation`)
- `GET /install` (protected): redirects to GitHub App installation URL
- `GET /install/url` (protected): returns installation URL JSON for frontend
- `GET /install/callback`:
  - Validates signed state token
  - Links installation to authenticated user
  - Triggers automatic repository sync
  - Redirects to frontend `/onboarding?installed=1`

### GitHub App integration (`src/modules/githubApp`)
- App JWT generation (RS256 via `jose`)
- Installation access token exchange
- Repository sync from GitHub API (`/installation/repositories`)
- Upsert repository metadata in DB

### Repository module (`src/modules/repository`)
- `GET /repos` (protected): lists repositories linked to current user installations

### Webhook module (`src/modules/webhook`)
- `POST /webhooks/github`
- Accepts payloads and currently logs `installation.created` metadata
- No persistence/queue publication yet

### API utilities
- `src/lib/prisma.ts`: Prisma client usage
- `src/utils/errors.ts`: centralized app error handling

## apps/web

### App shell & routing
- Auth flow pages:
  - `/login`
  - `/onboarding`
- Main product pages:
  - `/dashboard`
  - `/repositories/[repositoryId]`
- Root `/` redirects based on token presence

### API/Auth client layer
- `lib/api.ts`:
  - Base URL from `NEXT_PUBLIC_API_URL`
  - Standardized error handling (`ApiError`)
  - Adds auth headers
  - Adds `ngrok-skip-browser-warning` header for ngrok API base URL
- `lib/auth.ts`:
  - localStorage token lifecycle
  - hash-token consumption from OAuth callback
  - repo listing and installation URL retrieval helpers
  - clears token on 401

### Dashboard capabilities
- Repository list fetched from `/repos`
- Loading/error/retry states
- Search + status filters (`all`, `healthy`, `analyzing`)
- Summary cards derived from repository API data
- Empty state with onboarding CTA

### Repository detail capabilities
- Loads repo from `/repos` by `repositoryId`
- Displays real metadata (visibility/default branch/active status)
- Activity/AI insights/coverage sections currently placeholder content

### UI components implemented
- Layout: sidebar, dashboard header, repository header, top nav, footer
- Auth/onboarding: auth form, onboarding stepper, install panel, feature list

## workers/analyzer
- `src/index.ts` exists
- Current behavior: startup log only (scaffold)

## packages/shared
- Shared contracts exported:
  - `types/event.ts`
  - `types/finding.ts`
  - `enums/severity.ts`

## packages/config
- Minimal env placeholder exported (`NODE_ENV` fallback)
- Not yet the central typed config source for all services

## infra
- `infra/db`: migration assets/readme present
- `infra/redis`: readme present
- No queue runtime wiring implemented in app/worker code yet

---

## 4) Change History Snapshot (What Has Been Built)

### From `CHANGELOG.md`
- Webhook scaffold
- Installation persistence
- Installation redirect flow
- Auth middleware fix
- GitHub App JWT generation
- Installation access token exchange
- Repository sync implementation
- Automatic repository sync on callback
- Repository listing API (`GET /repos`)

### Additional implemented changes visible in current codebase
- Frontend Next.js app initialized under `apps/web`
- Full login + onboarding flow integrated with backend
- Token strategy moved to bearer-token client flow (frontend localStorage + auth header)
- Dashboard and repository detail pages implemented
- API-driven repository listing UI with filters/search/error states
- CORS handling expanded for localhost/ngrok usage and custom ngrok request header

---

## 5) Completion Against `DOCUMENTATION.md`

## Documented MVP scope (Phase 1)
1. GitHub webhook ingestion
2. Single AI agent (API contract analysis)
3. Realtime dashboard updates

### Phase 1 completion assessment
- **Webhook ingestion**: ✅ Implemented (receiver endpoint + structured handling/logging)
- **Single AI agent analysis**: ⛔ Not implemented (worker is scaffold only)
- **Realtime dashboard updates**: ⛔ Not implemented (no realtime transport)

**Strict Phase-1 completion: 1/3 = ~33% complete**

## High-level architecture layer completion (from documentation)
- GitHub event source: ✅
- Backend API control plane: ✅
- Internal event queue: ⛔
- AI workers: 🔶 Scaffold only
- PostgreSQL persistence: ✅ (core entities + repo sync)
- Realtime layer: ⛔
- Frontend dashboard: 🔶 Implemented for auth/onboarding/repo views, but no realtime/findings pipeline

**Architecture realization estimate: ~50–60% complete**
(Strong API+auth+repo foundation complete; AI analysis/realtime/event pipeline remains primary gap.)

---

## 6) Gaps to Reach Documented MVP

1. Implement queue publishing from webhook ingestion
2. Implement worker job consumption and event processing
3. Implement at least one analysis pass producing persisted findings
4. Expose findings APIs for dashboard/repository detail
5. Add realtime transport (WebSocket/SSE) and frontend subscriptions

---

## 7) Overall Status Verdict

Project foundation is solid and production-shaped for:
- identity/auth,
- GitHub App installation,
- repository discovery/sync,
- repository-centric dashboard UX.

The project is **not yet at documented MVP completion** because the defining AI + async + realtime loop is still pending.
