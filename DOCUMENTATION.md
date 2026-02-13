# Agentic Engineering Workflow AI

Agentic Engineering Workflow AI is an **event-driven, AI-assisted developer productivity system** that continuously monitors GitHub repositories, analyzes code changes in system context, and produces **explainable engineering findings** for human review.

The system is **agent-based**, **asynchronous by design**, and **human-in-the-loop**.  
It does not auto-modify code or auto-merge pull requests. Instead, it augments engineers with system-level insights that traditional linters and CI checks cannot provide.

---

## Core Problem

Modern engineering teams ship fast, but:

- API contracts break silently
- Architectural boundaries erode over time
- Refactors introduce unintended coupling
- Code reviews focus on syntax, not system impact

Existing tools are **static** and **shallow**. They lack:
- Context of the system
- Understanding of change impact
- Reasoning over code intent

This project introduces an **agentic AI layer** that understands *code changes in context* and surfaces risks, violations, and opportunities — without removing human judgment.

---

## Guiding Principles

- **Event-driven, not poll-based**
- **Asynchronous, not blocking**
- **Explainability over automation**
- **Human-in-the-loop by default**
- **Clear system boundaries**
- **Scale when needed, not before**

---

## High-Level Architecture

At a conceptual level, the system consists of:

1. **GitHub (external event source)**
2. **Backend API (control plane)**
3. **Internal event queue**
4. **AI worker agents**
5. **PostgreSQL database**
6. **Realtime update layer**
7. **Frontend dashboard**

Each layer has a **single responsibility** and communicates via well-defined boundaries.

---

## High-Level Flow

### 1. Repository Events
- Developers push code or open pull requests
- GitHub emits webhook events (push, PR, merge)

### 2. Webhook Ingestion
- Backend API receives and verifies webhook payloads
- Events are normalized and stored
- Events are published to an internal queue

### 3. Asynchronous AI Analysis
- AI workers consume queued events
- Workers fetch code diffs and metadata
- Engineering heuristics are applied
- LLMs are invoked with scoped context
- Findings are generated with explanations

### 4. Persistence & Realtime Updates
- Analysis results are stored transactionally
- Database changes trigger realtime broadcasts
- Frontend receives updates instantly

### 5. Human Review
- Engineers review findings
- System explains *what changed*, *why it matters*, and *what to consider*
- No automatic code changes are performed

---

## Monorepo Structure

This project uses a **monorepo** to maintain shared contracts while allowing **independent deployment** of each runtime.

```

.
├── apps/
│   ├── web/              # Frontend dashboard (Next.js)
│   └── api/              # Backend API (Fastify)
│
├── workers/
│   └── analyzer/         # Async AI analysis workers
│
├── packages/
│   ├── shared/           # Shared contracts (types, schemas)
│   └── config/           # Typed configuration & env handling
│
└── infra/
├── db/               # SQL, migrations, seeds
└── redis/            # Local/dev infrastructure configs

```

### Important Notes
- Each app is **independently deployable**
- `packages/shared` contains **contracts only**, not runtime logic
- No service directly imports another service’s internal code

---

## Subproject Overview

### `apps/web` — Frontend Dashboard
**Purpose**
- User-facing interface
- Displays repository status and AI findings
- Subscribes to realtime updates

**Characteristics**
- React / Next.js
- Realtime-first UX
- No direct GitHub or AI logic

---

### `apps/api` — Backend API (Control Plane)
**Purpose**
- GitHub App integration
- Webhook ingestion
- Auth coordination
- Event publication
- REST APIs for frontend

**Design Rules**
- Fast and deterministic
- No AI processing
- No long-running tasks

---

### `workers/analyzer` — AI Worker System
**Purpose**
- Perform deep, contextual analysis of code changes

**Responsibilities**
- Consume queued events
- Fetch diffs and metadata
- Apply engineering rules
- Invoke LLMs
- Produce structured findings

**Design Rules**
- Stateless per job
- Retryable
- Horizontally scalable

---

### `packages/shared` — Shared Contracts
**Purpose**
- Single source of truth for cross-service contracts

**Contains**
- TypeScript types
- Enums
- Zod schemas
- Constants

**Does NOT contain**
- Business logic
- Side effects
- Network or database code

---

## Data Model (Conceptual)

Core entities include:

- `users`
- `repositories`
- `events`
- `analysis_runs`
- `findings`

Each finding is:
- Traceable to an event
- Associated with an analysis run
- Explainable and auditable

---

## What the System Does NOT Do

- ❌ Auto-merge pull requests
- ❌ Modify user code
- ❌ Train on private repositories
- ❌ Replace human code reviews

These constraints are intentional and fundamental to trust.

---

## Current Scope (MVP)

### Phase 1
- GitHub webhook ingestion
- Single AI agent (API contract analysis)
- Realtime dashboard updates

### Phase 2 (Optional)
- Multiple agent types
- PR comments
- Severity filtering

---

## Why This Project Matters

This project demonstrates:
- Event-driven system design
- Asynchronous processing
- Real-world AI integration
- Clear architectural boundaries
- Engineering judgment over automation

It is designed to be both:
- A **portfolio centerpiece**
- A **foundation for a real SaaS product**

