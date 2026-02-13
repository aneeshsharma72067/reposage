# Agentic Engineering Workflow AI

An event-driven, AI-powered SaaS system for engineering workflows.

## Architecture

This is a monorepo containing:

- **apps/**: Deployable applications (web, api)
- **workers/**: Background workers (analyzer)
- **packages/**: Shared libraries (config, shared types/contracts)
- **infra/**: Infrastructure configuration (db, redis)

## getting Started

Prerequisites: Node.js, pnpm (recommended) or npm/yarn.

1. Install dependencies: `npm install`
2. Configure environment variables (see packages/config)
3. Run services individually.
