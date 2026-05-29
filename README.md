# DashPortfolio

Personal portfolio tracker for stocks, ETFs, crypto, and custom assets (e.g. home equity), with live price data, P&L, and a portfolio-over-time chart.

## Prerequisites

- [Node.js 24](https://nodejs.org) (see `.nvmrc` — use `nvm use` if you have nvm)
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)
- [Docker](https://www.docker.com) (required for the local Supabase stack)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)

## Local development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start the local Supabase stack

```bash
supabase start
```

This boots a full local Supabase instance via Docker:

| Service            | URL                                   |
| ------------------ | ------------------------------------- |
| API / Auth         | http://127.0.0.1:54321                |
| Studio (dashboard) | http://127.0.0.1:54323                |
| Database           | postgresql://localhost:54322/postgres |
| Inbucket (email)   | http://127.0.0.1:54324                |

On first run, `supabase start` will print your local keys — copy the `API URL`, `anon key` (or publishable key), and `JWT secret` into your `.env`.

### 3. Apply the schema

```bash
supabase db reset
```

This wipes and replays all migrations from scratch.

### 4. Configure environment variables

Copy `.env.example` to `.env` and fill in the values printed by `supabase start`:

```bash
cp .env.example .env
```

Key values to set from `supabase start` output:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase start>
SUPABASE_JWT_SECRET=<JWT secret from supabase start>
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon/publishable key from supabase start>
```

### 5. Start the API and web app

```bash
pnpm --filter api dev
pnpm --filter web dev
```

### Creating a test user

Open Studio at http://127.0.0.1:54323, go to **Authentication → Users**, and create a user manually. You can then sign in through the app at http://localhost:5173.

Outbound emails (e.g. magic links, password reset) are captured locally by Inbucket at http://127.0.0.1:54324 — nothing is sent to a real inbox.

## Useful commands

```bash
supabase stop          # Tear down the local stack
supabase db reset      # Wipe and replay all migrations (resets all local data)
supabase status        # Print local service URLs and keys
pnpm test              # Run all tests
```
