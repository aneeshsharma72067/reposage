# Agentic Engineering Workflow AI

An event-driven, AI-powered SaaS platform for engineering workflows.

## Live Demo

- Web App: https://reposage-web.vercel.app

## Architecture Diagram

```mermaid
flowchart LR
	U[User]
	W[Web App\nNext.js]
	A[API Service\nNode.js + Fastify]
	R[(Redis / BullMQ)]
	WK[Analyzer Worker\nTypeScript]
	AI[AI Layer\nGemini + Internal Prompts]
	DB[(PostgreSQL\nPrisma)]
	GH[Git Provider\nGitHub]

	U --> W
	W --> A
	A --> DB
	A --> R
	A --> GH
	R --> WK
	WK --> AI
	WK --> DB
	W <-->|Query / Realtime Fetch| A
```

## System Flow

```mermaid
sequenceDiagram
	participant User
	participant Web as Next.js Web
	participant API as Fastify API
	participant Queue as Redis/BullMQ
	participant Worker as Analyzer Worker
	participant AI as AI Analyzer Package
	participant DB as PostgreSQL
	participant GitHub

	User->>Web: Connect repository / request analysis
	Web->>API: Submit request
	API->>GitHub: Fetch repository metadata/diff
	API->>DB: Persist repository + job state
	API->>Queue: Enqueue analysis job
	Queue->>Worker: Deliver queued job
	Worker->>AI: Run commit/diff analysis prompts
	AI-->>Worker: Return findings + summaries
	Worker->>DB: Store analysis results
	Web->>API: Poll/fetch dashboard data
	API->>DB: Read findings and statuses
	API-->>Web: Return structured response
	Web-->>User: Show insights and recommendations
```

## Tech Stack

- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS
- Backend API: Node.js, Fastify, TypeScript
- Worker Layer: BullMQ-based background processing with TypeScript workers
- AI: Shared AI package (`packages/ai`) with Gemini integration and prompt modules
- Data: PostgreSQL with Prisma ORM and migrations
- Queue/Cache: Redis
- Monorepo: npm workspaces with structured apps/packages/workers separation
- Deployment: Vercel (web + API), containerized/background worker runtime

## Monorepo Structure

- **apps/**: Deployable applications (`web`, `api`)
- **workers/**: Background workers (`analyzer`)
- **packages/**: Shared libraries (`ai`, `config`, `shared`)
- **infra/**: Infrastructure configuration (`db`, `redis`)

## Getting Started

Prerequisites: Node.js, pnpm (recommended) or npm/yarn.

1. Install dependencies: `npm install`
2. Configure environment variables (see `packages/config` and app-level `.env` files)
3. Run services individually (`apps/api`, `apps/web`, and `workers/analyzer`)
