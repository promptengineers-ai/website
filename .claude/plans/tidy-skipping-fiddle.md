# Plan: Revert Magic Link Auth, Restore Email/Password Login

## Context

Issue #13. Magic link auth was introduced in commit `d364f4e` ("Deprecate password auth, make magic link the only login method") and enhanced in `a55fdf4` ("Add Remember my email checkbox"). The project needs to go back to email/password as the only auth method. Magic link code will be preserved on a separate branch.

## Approach: Targeted `git checkout` + manual edits

A blind `git revert` is unsuitable because `d364f4e` mixed auth changes with unrelated improvements (display name editing, viewport/PWA fixes, session name enrichment). We use `git checkout d364f4e^ -- <file>` to surgically restore password auth files while keeping the non-auth improvements.

---

## Pre-work: Preserve magic link on its own branch

```bash
git branch feat/magic-link-auth development
```

---

## Step 1: Restore deleted files (from `d364f4e^`)

| File                               | What it is                                 |
| ---------------------------------- | ------------------------------------------ |
| `src/components/auth/AuthForm.tsx` | Email/password form (login + signup modes) |
| `src/app/signup/page.tsx`          | Signup page                                |

```bash
git checkout d364f4e^ -- src/components/auth/AuthForm.tsx src/app/signup/page.tsx
```

## Step 2: Delete magic link files

| File                                          | What it is                 |
| --------------------------------------------- | -------------------------- |
| `src/app/auth/magic-link/sent/page.tsx`       | "Check your email" page    |
| `src/app/api/auth/magic-link/send/route.ts`   | Send magic link endpoint   |
| `src/app/api/auth/magic-link/verify/route.ts` | Verify magic link endpoint |
| `src/components/auth/MagicLinkForm.tsx`       | Magic link email form      |
| `src/lib/models/MagicLinkToken.ts`            | Token DB model             |
| `src/lib/magic-link.ts`                       | Token generation/hashing   |
| `src/lib/email.ts`                            | Resend email integration   |

## Step 3: Restore modified files (from `d364f4e^`)

| File                                   | Change                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `src/lib/auth.ts`                      | Restore `hashPassword`, `verifyPassword`, `validatePassword` (bcryptjs) |
| `src/app/api/auth/login/route.ts`      | Restore real password login (currently 410 Gone stub)                   |
| `src/app/api/auth/register/route.ts`   | Restore real registration handler (currently 410 Gone stub)             |
| `src/components/auth/AuthProvider.tsx` | Restore `login()` + `register()` methods, remove `sendMagicLink()`      |
| `src/app/login/page.tsx`               | Restore AuthForm-based login with redirect + "registered" banner        |
| `src/components/nav/TopNavBar.tsx`     | Restore Register button alongside Login                                 |

```bash
git checkout d364f4e^ -- src/lib/auth.ts src/app/api/auth/login/route.ts src/app/api/auth/register/route.ts src/components/auth/AuthProvider.tsx src/app/login/page.tsx src/components/nav/TopNavBar.tsx
```

## Step 4: Manual edits

### 4.1 `src/types/index.ts`

- Line 28: `passwordHash?: string` -> `passwordHash: string` (make required)
- Lines 165-172: Delete the `MagicLinkToken` type

### 4.2 `src/lib/models/User.ts`

- `createUser` param: `passwordHash?: string` -> `passwordHash: string` (required)
- Restore simple object construction (always include `passwordHash`, no conditional)
- Delete `createUserForMagicLink` function (lines 108-116)
- **Keep** `updateUserEmailVerified` and `updateUserName` (used by profile editing)

### 4.3 `src/lib/initDb.ts`

- Remove `import { createMagicLinkTokenIndexes } from "./models/MagicLinkToken"`
- Remove `await createMagicLinkTokenIndexes()` call

### 4.4 `package.json`

- Remove `"resend": "^6.9.4"` from dependencies
- Run `npm install` to update lockfile

### 4.5 `.github/workflows/ci.yml`

- Remove `RESEND_API_KEY: re_placeholder` and `NEXT_PUBLIC_APP_URL: http://localhost:3000` from build env

### 4.6 `CLAUDE.md`

- Remove magic link auth documentation (magicLinkTokens collection, auto-registration, optional passwordHash, rate limiting)
- Remove `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL` from env vars section

## Files intentionally KEPT as-is (non-auth improvements from d364f4e)

| File                                     | Reason to keep                      |
| ---------------------------------------- | ----------------------------------- |
| `src/app/layout.tsx`                     | Viewport/PWA metadata fixes         |
| `src/app/api/auth/session/route.ts`      | Name enrichment in session response |
| `src/app/api/users/profile/route.ts`     | Display name update feature         |
| `src/app/profile/edit/page.tsx`          | Display name editing UI             |
| `src/components/profile/ProfileForm.tsx` | Display name field                  |

---

## Verification

1. `npm run lint` -- no dead imports to deleted magic link files
2. `npm run test` -- existing `auth-helpers.test.ts` and `validation.test.ts` pass
3. `npm run build` -- Next.js pre-renders successfully (no broken imports)
4. Manual: `/login` shows email + password form; `/signup` renders; navbar shows Login + Register buttons

## Verification with agent-browser

After all code changes and CI checks pass, run browser-based QA using `agent-browser` CLI:

1. **Login page renders correctly**: Navigate to `/login`, verify email + password fields are present, no magic link references
2. **Signup page renders correctly**: Navigate to `/signup`, verify name + email + password + confirm password fields, password requirements hint shown
3. **Navigation**: Verify navbar shows both "Login" and "Register" buttons when logged out
4. **Registration flow**: Register a new user via `/signup`, verify redirect to `/profile` after success
5. **Login flow**: Log in with the registered credentials via `/login`, verify redirect and user menu appears in navbar
6. **Logout**: Click Sign Out from user menu, verify redirect to home and Login/Register buttons reappear

## Risk: Existing magic-link-only users

Users who signed up via magic link have no `passwordHash` in their DB document. After this change, they cannot log in until an admin sets a password for them. This is acceptable since the community is small (~1,700 members, likely few magic-link-only accounts).
