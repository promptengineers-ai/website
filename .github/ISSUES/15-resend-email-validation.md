---
name: Feature Request
about: Propose a new feature with enough detail for autonomous agent implementation
title: "feat: Email verification on signup via Resend"
labels: enhancement
assignees: ""
---

## Metadata

> **IMPORTANT**: The very first step should _ALWAYS_ be validating this metadata section to maintain a **CLEAN** development workflow.

```yml
pull_request_title: "FROM feat/15-resend-email-validation TO development"
branch: "feat/15-resend-email-validation"
worktree_path: "$WORKSPACE/.worktrees/feat-15"
```

---

## User Stories

- As a **new user**, I want **to receive a verification email after signup** so that **I can prove I own the email address before accessing the platform**.
- As a **new user**, I want **to click a verification link in my email** so that **my account is activated and I can log in**.
- As a **user who missed the verification email**, I want **to request a new verification email from the login page** so that **I can still verify my account without re-registering**.
- As a **community admin**, I want **only verified email addresses in the member directory** so that **spam and fake signups are prevented**.

---

## Summary

The `emailVerified` field and `updateUserEmailVerified()` helper already exist in the codebase (added during the #13 JWT auth refactor) but are never enforced. Registration currently auto-logs users in without any email check. This feature wires up [Resend](https://resend.com/docs/send-with-nextjs) as the transactional email provider to gate login behind email verification.

**Flow overview:**

1. **Register** — create user (`emailVerified: false`) → generate crypto token → store token + 24h expiry on user doc → send verification email via Resend → return `requiresVerification: true` (no auto-login)
2. **Verify** — user clicks email link → `POST /api/auth/verify-email` → validate token + expiry → set `emailVerified: true` → clear token → redirect to login
3. **Login** — check `emailVerified`; reject with 403 + `unverified: true` if false → client shows "Resend verification email" button
4. **Resend** — `POST /api/auth/resend-verification` → generate new token → send new email → generic 200 (no enumeration)

### Visual Reference

- Resend Next.js integration: https://resend.com/docs/send-with-nextjs
- Resend TypeScript examples (App Router patterns, React Email templates, centralized client): https://github.com/resend/resend-examples/tree/main/nextjs-resend-examples/typescript
- Previous attempt (reverted): PR #14 / Issue #13 — magic link approach was too disruptive; this feature keeps email/password auth and only adds a verification gate

---

## Key Integration Points

| File                                            | Function(s)                                                                          | Role                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `src/lib/email.ts`                              | `generateVerificationToken()`, `sendVerificationEmail()`                             | **NEW** — Resend client init, token generation (crypto.randomBytes), email dispatch |
| `src/lib/models/User.ts`                        | `setVerificationToken()`, `getUserByVerificationToken()`, `clearVerificationToken()` | **NEW functions** — CRUD for verification token/expiry fields on user doc           |
| `src/lib/models/User.ts`                        | `updateUserEmailVerified()`                                                          | **EXISTS** — sets `emailVerified: true` (line 106)                                  |
| `src/app/api/auth/register/route.ts`            | `POST`                                                                               | **MODIFY** — remove auto-login, add token generation + email send                   |
| `src/app/api/auth/login/route.ts`               | `POST`                                                                               | **MODIFY** — add `emailVerified` check, return 403 with `unverified: true` if false |
| `src/app/api/auth/verify-email/route.ts`        | `POST`                                                                               | **NEW** — validate token, mark verified, clear token                                |
| `src/app/api/auth/resend-verification/route.ts` | `POST`                                                                               | **NEW** — generate new token, send email, generic response                          |
| `src/types/index.ts`                            | `User` type                                                                          | **MODIFY** — add `verificationToken?: string`, `verificationTokenExpiry?: Date`     |
| `src/lib/initDb.ts`                             | `createUserIndexes()`                                                                | **MODIFY** — add sparse index on `verificationToken`                                |

---

## UI Integration Points

| Component / Route                      | Change Type | Description                                                                                                                                              |
| -------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/signup/page.tsx`              | Modify      | Redirect to `/login?registered=true` instead of `/profile` after registration                                                                            |
| `src/app/login/page.tsx`               | Modify      | Show "check your email" banner for `?registered=true`, "verified!" banner for `?verified=true`, "Resend verification" button on unverified login attempt |
| `src/components/auth/AuthProvider.tsx` | Modify      | `register()` returns `{ requiresVerification: true }` instead of setting auth state                                                                      |
| `src/app/verify-email/page.tsx`        | New page    | Client page that reads `?token=` param, calls verify API on mount, shows success/failure + links                                                         |

---

## Storage

- **Persistence layer**: MongoDB via native driver (`src/lib/mongodb.ts`) — existing connection pool
- **Collection**: `users` (existing) — verification token fields added directly to user document (no separate collection)
- **Model pattern**: New CRUD functions in `src/lib/models/User.ts` following existing patterns (`setVerificationToken`, `getUserByVerificationToken`, `clearVerificationToken`)
- **Index**: Sparse index on `verificationToken` for efficient lookups; no TTL index needed since expiry is checked at query time

---

## Architectural Decisions

- **Source of truth**: MongoDB `users` collection — `emailVerified`, `verificationToken`, and `verificationTokenExpiry` fields on the user document
- **State management**: React Context via `AuthProvider` — `register()` return type changes to `{ requiresVerification: true } | AuthUser`; no new context needed
- **Auth / scoping**: Unverified users never receive a JWT (register no longer auto-logs in, login rejects them), so `src/middleware.ts` needs **no changes** — the JWT gate is sufficient
- **Token storage**: Store raw hex token on user doc (not hashed) — acceptable because tokens are single-use, short-lived (24h), and the DB is not publicly accessible. Keeps implementation simple.
- **Email provider**: Resend SDK (`resend` npm package) — `RESEND_API_KEY` and `RESEND_FROM_EMAIL` already configured in `.env`. Follow the [centralized client pattern](https://github.com/resend/resend-examples/tree/main/nextjs-resend-examples/typescript) from Resend's official examples: single `Resend` instance exported from `src/lib/resend.ts`, imported by all routes that send email.
- **Email format**: Plain HTML string (no `@react-email/components` dependency) — keeps it minimal; can upgrade to React Email templates later if needed
- **Enumeration prevention**: `/api/auth/resend-verification` always returns generic 200 regardless of whether the email exists
- **Existing user migration**: One-time script to set `emailVerified: true` for all users created before this feature deploys (add to `scripts/`)

---

## Design Principles

- Simplicity is beauty, complexity is pain.
- _ALWAYS_ look at the current codebase first — achieve the goal in the **least amount of changes**.
- TDD-first: write tests before implementation.
- Follow existing patterns: native MongoDB driver (no ORM), Tailwind CSS only, App Router conventions.
- Leverage what already exists: `emailVerified` field, `updateUserEmailVerified()`, Resend env vars are all already in place — wire them up, don't reinvent.
- Fail gracefully: if Resend API call fails during registration, still create the user (they can resend later). Log the error.

---

## Out of Scope

- **Rate limiting** on resend-verification endpoint (per-user token replacement is sufficient for MVP)
- **React Email / `@react-email/components`** — plain HTML email is sufficient; can upgrade later
- **Admin dashboard** for verification status (visible in MongoDB directly)
- **"Change email" verification flow** — only initial signup verification
- **Password reset emails** — project currently links to LinkedIn for password issues
- **Middleware changes** — unverified users never get a JWT, so route protection is already handled
- **Brevo integration changes** — Resend handles transactional email; Brevo remains for newsletter/marketing
- **Magic link auth** — explicitly reverted in PR #14; this feature keeps email/password + verification gate

---

## Acceptance Criteria

- [ ] Implementation plan is thoroughly documented
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (new tests added if applicable)
- [ ] `npm run build` succeeds
- [ ] New code follows existing repo patterns (`src/lib/models/` for data, `src/app/api/` for routes, Tailwind for styles)
- [ ] No new dependencies added beyond what's already in the project (or justified in PR description)
- [ ] Draft PR opened: `FROM feat/15-resend-email-validation TO development`
- [ ] `resend` is the only new npm dependency added
- [ ] `POST /api/auth/register` creates user with `emailVerified: false`, generates token, sends verification email via Resend, and does NOT set auth cookie
- [ ] `POST /api/auth/login` returns 403 with `{ unverified: true }` for users where `emailVerified === false`
- [ ] `POST /api/auth/verify-email` accepts `{ token }`, validates against DB (checks expiry), sets `emailVerified: true`, clears token fields
- [ ] `POST /api/auth/resend-verification` accepts `{ email }`, generates new token + sends email, returns generic 200 (no email enumeration)
- [ ] `/verify-email?token=X` page shows success with login link or failure with resend option
- [ ] `/login?registered=true` shows "check your email to verify" banner
- [ ] `/login?verified=true` shows "email verified, please sign in" banner
- [ ] Login page shows "Resend verification email" button when login fails due to unverified email
- [ ] Existing users are handled via migration script (`scripts/migrate-verify-existing.ts` sets `emailVerified: true` for pre-existing users)
- [ ] CI workflow (`.github/workflows/ci.yml`) has dummy `RESEND_API_KEY` env var for build step
- [ ] Verification tokens expire after 24 hours
- [ ] Token is cleared from user doc after successful verification (single-use)
