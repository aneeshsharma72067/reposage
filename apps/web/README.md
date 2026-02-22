# Web App

Production-structured Next.js App Router frontend for:

- Authentication (`/login`)
- GitHub App onboarding (`/onboarding`)

## Environment

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Scripts

- `npm run dev --workspace=apps/web`
- `npm run build --workspace=apps/web`
- `npm run lint --workspace=apps/web`
