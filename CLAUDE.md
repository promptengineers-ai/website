# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Community website for Prompt Engineers AI (~1,700+ member AI developer group in Dallas/Plano, TX). Full-stack Next.js 14 app with custom JWT auth, MongoDB, and member/hackathon management.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint with next/core-web-vitals + exhaustive-deps
npm run test     # Vitest (unit + component tests)
npm run test:watch  # Vitest in watch mode
```

Utility scripts (run with `npx ts-node --compiler-options '{"module":"commonjs"}' scripts/<file>`):
- `scripts/create-admin.ts` — Create admin user
- `scripts/seed-hackathon.ts` — Seed hackathon data

## Architecture

**Framework**: Next.js 14.2.4 with App Router, React 18, TypeScript (strict mode)
**Styling**: Tailwind CSS only (no CSS modules). Framer Motion for animations.
**Database**: MongoDB 7 native driver (no ORM). Direct collection operations in `src/lib/models/`.
**File Storage**: MongoDB GridFS (avatars bucket: 5MB max, resumes bucket: 10MB max)
**Deployment**: Netlify via `@netlify/plugin-nextjs`

### Path alias

`@/*` maps to `./src/*` (configured in tsconfig.json)

### Authentication

- Custom JWT auth with HTTP-only cookies (cookie name: `auth-token`)
- Two JWT libraries: `jose` for Edge Runtime (middleware), `jsonwebtoken` for Node API routes
- Middleware (`src/middleware.ts`) protects `/profile/*` routes, redirects to `/login?from={path}`
- Auto-refresh: tokens valid 30 days, refreshed when <7 days remain
- Password hashing: bcryptjs with 12 salt rounds

### Data layer

- `src/lib/mongodb.ts` — Connection pool (max 10), GridFS bucket factory, global singleton in dev
- `src/lib/models/` — CRUD functions per collection: User, Profile, Hackathon, HackathonTeam, HackathonRegistration
- `src/lib/validation.ts` — Shared input validation: `isValidObjectId()`, `validateSlug()`, `validateDate()`, `parseJsonBody()`
- `src/lib/auth-helpers.ts` — Shared auth guards: `requireAuth()`, `requireAdmin()` (returns typed result or 401/403)
- `src/types/index.ts` — All TypeScript type definitions + constants (`HACKATHON_ROLES`, `INVOLVEMENT_TYPES`, etc.)
- No ORM — all queries use native MongoDB driver (`collection.findOne`, `insertOne`, `updateOne`, etc.)

### Key directories

- `src/app/` — App Router pages and API routes
- `src/app/api/` — REST API endpoints (auth, users, members, files, hackathons, contact, subscribe)
- `src/components/` — React components organized by domain (auth, profile, hackathon, members, nav, etc.)
- `src/sections/` — Landing page sections (Hero, About, Service, Project, Contact, Roadmap, etc.)
- `src/lib/` — Server-side logic (DB, auth, JWT)
- `src/utils/` — Client-side utilities (API client class, RSS parser, formatting)
- `src/config/` — App config (GA ID, social links, chatbot, static assets)
- `arch-docs/` — Architecture documentation (wiki/ for humans, ai-ref/ for AI-optimized reference)

### External integrations

- **Airtable**: Contact form submissions
- **Brevo**: Newsletter/email marketing
- **Google Analytics 4**: Via `@next/third-parties`
- **Medium RSS**: Blog feed aggregation

### Data fetching pattern

Plain `fetch()` with `useEffect` hooks (no SWR/React Query). Client-side API wrapper in `src/utils/client.ts`.

### UI Components

- `src/components/ui/Toast.tsx` — `<ToastProvider>` + `useToast()` hook for toast notifications (success/error/info, auto-dismiss 3s)
- `src/components/ui/ConfirmDialog.tsx` — Accessible confirm dialog using `@headlessui/react` `<Dialog>` (focus trap, Escape, aria-modal)
- All hackathon modals use `@headlessui/react` `<Dialog>` for accessibility

### State management

React Context only — `AuthProvider` at `src/components/auth/AuthProvider.tsx` provides `useAuth()` hook. `ToastProvider` wraps app in root layout. No external state library.

## Environment Variables

Required:
- `MONGO_DB_URI` — MongoDB connection string
- `NEXTAUTH_SECRET` — JWT signing secret (generate with `openssl rand -base64 32`)

Optional:
- `AIRTABLE_API_KEY` — Airtable API key for contact form
- `BREVO_API_KEY` — Brevo email service key
- `NEXT_PUBLIC_GA_ID` — Google Analytics 4 measurement ID

## Testing

**Framework**: Vitest + @testing-library/react + jsdom. Config in `vitest.config.ts`, setup in `src/test/setup.ts`.
- Tests live next to source in `__tests__/` directories (e.g., `src/lib/__tests__/validation.test.ts`)
- `npm run test` runs all tests; `npm run test:watch` for dev
- Globals enabled (`describe`, `it`, `expect` without imports)

## CI/CD

**GitHub Actions** (`.github/workflows/ci.yml`): runs on every push to any branch.
- Steps: `npm ci` → `npm run lint` → `npm run test` → `npm run build`
- Build step requires `MONGO_DB_URI` and `NEXTAUTH_SECRET` env vars (dummy values in CI) because Next.js pre-renders API routes that import the MongoDB client

**Pre-commit hooks**: Husky + lint-staged runs ESLint --fix and Prettier on staged `.ts`/`.tsx` files.

## TypeScript Gotchas

- `vitest.config.ts` is excluded from `tsconfig.json` — `@vitejs/plugin-react` types use syntax incompatible with the project's TS version
- `Set` spread (`[...new Set()]`) fails without `downlevelIteration` — use `Array.from(new Set())` instead
- `parseJsonBody()` returns `Record<string, unknown>` — always cast the destructured body with `as { field: Type }` before passing to typed functions
