# DashPortfolio — Claude Code briefing

**IMPORTANT**: Never commit code on users behalf

## Node.js version

This project requires Node.js 24 (see `.nvmrc`). The Bash tool spawns a non-interactive shell
that doesn't source ~/.zshrc, so nvm is not on PATH. Prepend the node 24 bin dir directly:

```
PATH="$HOME/.nvm/versions/node/v24.13.1/bin:$PATH" pnpm ...
```

## What this project is

DashPortfolio is a personal portfolio tracker. It tracks stocks, ETFs, crypto, and custom
assets (e.g. home equity) with live price data, P&L, and a portfolio-over-time chart.

## Monorepo structure (approximate — adjust as the project grows)

```
dashportfolio/
├── apps/
│   ├── api/          Hono + Kysely — Node.js REST API
│   └── web/          Vue 3 + Vite + Quasar — PWA, mobile-first
├── packages/
│   ├── types/        Shared TypeScript interfaces and Zod schemas
│   ├── db/           Kysely-generated DB types
│   └── config/       Shared tsconfig base, ESLint config, env schema
├── CLAUDE.md
├── package.json      pnpm workspace root
└── pnpm-workspace.yaml
```

Package manager is **pnpm**. Always use pnpm, never npm or yarn.
Workspaces are defined in `pnpm-workspace.yaml`. Internal packages are referenced as
`@dashportfolio/types`, `@dashportfolio/db`, `@dashportfolio/config`.

## Tech stack

| Layer              | Choice                                                                       |
| ------------------ | ---------------------------------------------------------------------------- |
| API framework      | Hono with `@hono/zod-openapi`                                                |
| Query builder      | Kysely (no ORM)                                                              |
| Migrations         | Plain SQL files in `apps/api/migrations/`, run via Supabase CLI              |
| Validation         | Zod — shared schemas live in `packages/types`                                |
| Auth               | Supabase Auth — frontend uses `@supabase/supabase-js` directly for sign-in/sign-out/session management. API validates JWTs with `jose` in middleware. |
| Database           | Postgres via Supabase — service role key only, Data API disabled             |
| Background jobs    | BullMQ + Redis                                                               |
| Frontend framework | Vue 3 (Composition API, `<script setup>`)                                    |
| State management   | Pinia                                                                        |
| UI components      | Quasar                                                                       |
| Price data         | Polygon.io                                                                   |
| Hosting            | Railway (API) + Netlify (web)                                                |

## Code style rules

- **TypeScript everywhere.** No `any`. Use `unknown` and narrow it.
- **Zod for all external boundaries.** Validate env vars at startup, API request bodies,
  and Polygon.io responses.
- **Kysely for all DB queries.** No raw SQL strings except in migration files.
- **Explicit return types on all exported functions.**
- **Named exports only.** No default exports except Vue SFCs and Vite/config files
  where the tooling requires it.
- **No barrel files (`index.ts` that re-exports everything).** Import directly from
  the source file. Barrels make tree-shaking harder and obscure where things live.
- **Error handling:** use a `Result<T, E>` pattern or typed error classes rather than
  throwing strings.
- **Env vars:** parsed and validated with Zod at startup in `packages/config/env.ts`.
- **Comments:** only when the _why_ is non-obvious — a constraint, a workaround, a subtle
  invariant. Don't narrate what the code does; well-named identifiers do that.
  Average-codebase density, not tutorial density. No decorative or structural comment
  patterns (section separators, dividers, region markers) — they can't be enforced and
  will drift out of sync.
- **File naming with role suffixes:** files in `src/routes/` use `.routes.ts`, files in
  `src/middleware/` use `.middleware.ts`, files in `src/services/` use `.service.ts`.
  Files in utility directories like `src/lib/` need no suffix — their directory
  provides enough context.

## API conventions (`apps/api`)

- Routes are defined with `@hono/zod-openapi`. Every route has a typed request schema
  and a typed response schema. The OpenAPI spec is the source of truth.
- Route files live in `src/routes/` — one file per domain
  (`auth.routes.ts`, `holdings.routes.ts`, `assets.routes.ts`, `prices.routes.ts`).
- Middleware files live in `src/middleware/` and are suffixed `.middleware.ts`
  (e.g. `auth.middleware.ts`).
- Business logic lives in `src/services/` — route handlers should be thin.
- Auth middleware extracts and verifies the Supabase JWT and attaches `ctx.var.userId`.
  All protected routes use this middleware. Never trust a userId from the request body.
- All DB queries must filter by `userId` from the verified session, never from
  request input.
- Pagination uses cursor-based pagination, not offset. Use `created_at` + `id` as
  the cursor.
- Prices are never fetched live on a user request. They come from the DB,
  populated by the background price sync job.

## Database conventions

- All tables have: `id uuid primary key default gen_random_uuid()`,
  `created_at timestamptz not null default now()`,
  `updated_at timestamptz not null default now()`.
- Currency is always stored as the asset's native currency ISO code (e.g. `USD`, `GBP`).
  FX conversion happens at read time, never at write time.
- Monetary amounts are stored as `numeric(20, 8)` — never floats.
- Migrations are plain SQL files named `0001_description.sql`, `0002_description.sql`.
  Never edit a migration that has already been applied. Add a new one.
- RLS is enabled on all tables. Policies are defined even though the service role
  bypasses them — they serve as documentation and a safety net.
- Supabase project is configured with Data API disabled, automatic RLS enabled,
  auto-expose new tables disabled. Service role key only.

## Frontend conventions (`apps/web`)

- Vue Composition API with `<script setup>` only. No Options API.
- Pinia stores mirror API domains — one store per resource.
- All API calls go through a typed client in `src/lib/api.ts` that wraps fetch.
  Never call fetch directly in a component or store.
- Mobile-first. Every layout is designed for a ~390px viewport first.
  Desktop is an enhancement.
- `@supabase/supabase-js` is used in `apps/web` for auth only (sign-in, sign-out,
  session management via `onAuthStateChange`). The Supabase client instance lives in
  `src/lib/supabase.ts` and is imported where needed — never instantiated inline.

## What not to do

- Do not install Prisma or any other ORM.
- Do not install `@supabase/supabase-js` in `apps/api` — the API has no need for it. JWT validation uses `jose` directly.
- Do not use the Supabase client for anything other than auth in `apps/web` — no direct DB queries, no storage, no realtime from the frontend.
- Do not access `process.env` directly — use the validated env module.
- Do not add a `src/index.ts` barrel file.
- Do not use `any`.
- Do not write offset-based pagination.
- Do not store monetary values as floats.
- Do not fetch live prices on a user-facing request.
- Do not trust `userId` from request bodies — always use `ctx.var.userId` from
  the auth middleware.

