# Deprecate Password Auth + First-Login Redirect to /profile/edit

## Context

Magic link auth is now implemented and working. The app still has a parallel password-based auth flow (login, register, signup page) that should be removed — magic link should be the **only** way to authenticate. Additionally, new users (first magic link verification) currently land on `/profile?welcome=true`, but they should land on `/profile/edit` instead so they fill out their profile immediately.

---

## Step 1: First-login redirect → `/profile/edit`

**File**: `src/app/api/auth/magic-link/verify/route.ts`

- Line 83-84: Change redirect from `${baseUrl}/profile?welcome=true` → `${baseUrl}/profile/edit`
- The `?welcome=true` param was never consumed by any page, so this is clean

---

## Step 2: Delete password signup page

**Delete**: `src/app/signup/page.tsx`

Magic link auto-registers, so this page is redundant. `/signup` will 404.

---

## Step 3: Delete AuthForm component

**Delete**: `src/components/auth/AuthForm.tsx`

Password login/signup form. Only imported by `login/page.tsx` (updated in Step 4) and `signup/page.tsx` (deleted in Step 2).

---

## Step 4: Rewrite login page to magic-link-only

**File**: `src/app/login/page.tsx`

Remove all password-related code:

- Remove `AuthForm` import, `useAuth` import
- Remove `tabParam`, `registered` from searchParams
- Remove `activeTab`/`setActiveTab` state and `useEffect`
- Remove `handleLogin` function
- Remove the `registered` green banner
- Remove the entire password tab branch and tab toggle buttons

Keep:

- `errorParam === 'magic-link-expired'` banner
- Magic link layout: back arrow, robot emoji, "Sign in with magic link" heading, `<MagicLinkForm />`
- `Suspense` wrapper

---

## Step 5: Update MagicLinkForm — remove signup link

**File**: `src/components/auth/MagicLinkForm.tsx`

- Lines 86-96: Replace "Don't have an account? Create one" link with: "New here? Just enter your email above — we'll create your account automatically."
- Remove unused `Link` import (line 4) and `fromQuery` variable (line 12)

---

## Step 6: Remove Register button from TopNavBar

**File**: `src/components/nav/TopNavBar.tsx`

- Lines 170-175: Remove the "Register" `<Link>` to `/signup`. Keep only the "Login" button.

---

## Step 7: Remove `login` and `register` from AuthProvider

**File**: `src/components/auth/AuthProvider.tsx`

- Remove `login()` function (lines 55-66) and its type in `AuthContextValue` (line 16)
- Remove `register()` function (lines 68-79) and its type (line 17)
- Remove their entries from the `value` object (lines 103-104)
- Keep: `sendMagicLink`, `refreshSession`, `logout`, `user`, `status`

---

## Step 8: Deprecate password API routes (410 Gone)

**File**: `src/app/api/auth/login/route.ts`

Replace handler with a 410 stub:

```ts
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Password login is deprecated. Use magic link at /login." },
    { status: 410 },
  );
}
```

**File**: `src/app/api/auth/register/route.ts`

Same 410 stub treatment. Remove all old imports from both files.

Rationale: 410 Gone gives lingering clients a clear signal vs. a confusing 404.

---

## Step 9: Clean up `src/lib/auth.ts`

**File**: `src/lib/auth.ts`

- Remove `bcryptjs` import, `SALT_ROUNDS`, `hashPassword()`, `verifyPassword()`, `validatePassword()`
- Keep `validateEmail()` (used by magic-link send route) and `validateUrl()` (used by profile API)

Note: `bcryptjs` stays in `package.json` because `scripts/create-admin.ts` imports it directly.

---

## Step 10: Minor cleanup — magic link sent page

**File**: `src/app/auth/magic-link/sent/page.tsx`

- Line 48: Change `/login?tab=magic-link` → `/login` (tabs no longer exist)

---

## Files Changed

| File                                          | Change                                                    |
| --------------------------------------------- | --------------------------------------------------------- |
| `src/app/api/auth/magic-link/verify/route.ts` | Redirect new users to `/profile/edit`                     |
| `src/app/signup/page.tsx`                     | **DELETE**                                                |
| `src/components/auth/AuthForm.tsx`            | **DELETE**                                                |
| `src/app/login/page.tsx`                      | Rewrite: magic-link only, no tabs                         |
| `src/components/auth/MagicLinkForm.tsx`       | Replace signup link with auto-register text               |
| `src/components/nav/TopNavBar.tsx`            | Remove Register button                                    |
| `src/components/auth/AuthProvider.tsx`        | Remove `login()` and `register()`                         |
| `src/app/api/auth/login/route.ts`             | 410 Gone stub                                             |
| `src/app/api/auth/register/route.ts`          | 410 Gone stub                                             |
| `src/lib/auth.ts`                             | Remove password functions, keep validateEmail/validateUrl |
| `src/app/auth/magic-link/sent/page.tsx`       | Fix link: `/login?tab=magic-link` → `/login`              |

## Files NOT Changed (confirmed safe)

- `src/middleware.ts` — JWT-based, auth-method agnostic
- `src/lib/jwt.ts` — JWT is still the session mechanism
- `src/app/api/auth/session/route.ts` — reads JWT only
- `src/app/api/auth/logout/route.ts` — clears cookie only
- `src/app/api/auth/magic-link/send/route.ts` — already correct
- `src/lib/models/User.ts` — keep `passwordHash` optional for DB backward compat
- `src/types/index.ts` — keep `passwordHash?: string` on User type
- `scripts/create-admin.ts` — dev utility, update separately

## Verification

1. `npm run lint` — no new warnings
2. `npm run test` — all existing tests pass
3. `npm run build` — production build succeeds
4. Manual: `/login` shows only magic link form (no tabs, no password fields)
5. Manual: `/signup` → 404
6. Manual: TopNavBar shows only "Login" button when logged out
7. Manual: New user clicks magic link → lands on `/profile/edit`
8. Manual: Existing user clicks magic link → lands on `/profile`
9. Manual: `POST /api/auth/login` returns 410 Gone
10. Manual: `POST /api/auth/register` returns 410 Gone
