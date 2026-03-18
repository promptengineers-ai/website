# Plan: Fix All 54 Code Review Issues (TDD Approach)

## Context

The code review report (`specs/CODE_REVIEW_REPORT.md`) identified 54 issues (3 critical, 12 high, 22 medium, 17 low) across the hackathon feature. The project currently has **no testing framework, no pre-commit hooks, and no CI pipeline**. The user wants a TDD approach: set up testing infrastructure first, write tests before fixes, and add linting/hooks/CI to enforce quality going forward.

**Key constraint:** The project already has `@headlessui/react` installed — we should use its `<Dialog>` component for accessible modals instead of building a custom `ModalWrapper` from scratch.

---

## Phase 0: Testing & CI Infrastructure

### 0.1 Install Vitest + Testing Libraries

**Why Vitest:** Same Vite-based transform pipeline Next.js uses, fast, ESM-native, compatible with `@testing-library/react`.

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**New file:** `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

**New file:** `src/test/setup.ts`

```typescript
import "@testing-library/jest-dom/vitest";
```

**Update `package.json` scripts:**

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### 0.2 Install Husky + lint-staged (Pre-commit Hooks)

```bash
npm install -D husky lint-staged
npx husky init
```

**New file:** `.husky/pre-commit`

```bash
npx lint-staged
```

**Add to `package.json`:**

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

### 0.3 GitHub Actions CI Workflow

**New file:** `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [development, main]
  pull_request:
    branches: [development, main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### 0.4 Strengthen ESLint

**Update `.eslintrc.json`** to add rules that catch issues from the report:

```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "@next/next/no-img-element": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

---

## Phase 1: Shared Helpers (A — foundations for other fixes)

### A1. `src/lib/validation.ts` — Input validation helpers

- `isValidObjectId(id)` — validates ObjectId format (issues 1.1, 1.2)
- `parseJsonBody(request)` — safe JSON parsing with 400 on failure (issue 1.3)
- `validateSlug(slug)` — regex check `/^[a-z0-9-]+$/` (issue 1.4)
- `validateDate(dateStr)` — returns parsed Date or null (issue 3.6)

**TDD:** Write `src/lib/__tests__/validation.test.ts` first with cases for valid/invalid ObjectIds, malformed JSON, valid/invalid slugs, valid/invalid dates.

### A2. `src/lib/auth-helpers.ts` — Auth guard helpers

- `requireAdmin(request)` — returns `{ ok, auth, user }` or `{ ok: false, response }` (issue 6.4)
- `requireAuth(request)` — same pattern, no admin check

**TDD:** Write `src/lib/__tests__/auth-helpers.test.ts` — mock `getAuthFromRequest` and `getUserById`, test unauthorized/forbidden/success paths.

### A3. `src/types/index.ts` — Export `INVOLVEMENT_TYPES` constant (issue 6.3)

### A4. `src/components/ui/Toast.tsx` — Toast context + provider + component

- `useToast()` hook returning `toast(message, type)` (replaces `alert()`)
- Types: `"success" | "error" | "info"`, auto-dismiss after 3s
- Update `src/app/layout.tsx` to wrap with `<ToastProvider>`

### A5. `src/components/ui/ConfirmDialog.tsx` — Accessible confirm dialog

- Use `@headlessui/react` `<Dialog>` (already installed!) for modal accessibility
- Props: `open`, `title`, `message`, `onConfirm`, `onCancel`, `variant`
- Replaces browser `confirm()` calls

**TDD:** Write `src/components/ui/__tests__/Toast.test.tsx` and `ConfirmDialog.test.tsx` — test rendering, dismiss behavior, confirm/cancel callbacks.

---

## Phase 2: Security Fixes (B)

### B1. CRITICAL: Input validation in reorder endpoint (issue 1.1)

- **File:** `src/app/api/hackathons/[slug]/teams/reorder/route.ts`
- Validate each `teamId` with `isValidObjectId()`
- Verify each team belongs to the current hackathon

### B2. ObjectId validation in participants endpoint (issue 1.2)

- **File:** `src/app/api/hackathons/[slug]/participants/route.ts:109`
- Guard `new ObjectId(userId)` with `isValidObjectId(userId)`

### B3. Malformed JSON handling (issue 1.3)

- **Files:** All 8 POST/PATCH/DELETE endpoints
- Replace `await request.json()` with `parseJsonBody(request)`

### B4. Slug validation on GET requests (issue 1.4)

- **Files:** All GET endpoints receiving `params.slug` (7 files)
- Add `validateSlug()` call at top of each handler

### B5. XSS audit (issue 1.5)

- **File:** `src/components/hackathon/TeamCardGrid.tsx`
- Verified: No `dangerouslySetInnerHTML`. React escapes by default. No code change needed — document in PR.

**TDD:** Write `src/app/api/hackathons/__tests__/security.test.ts` — test invalid ObjectIds return 400, malformed JSON returns 400, invalid slugs rejected, valid inputs pass through.

---

## Phase 3: Business Logic Fixes (D)

### D1. Remove redundant race-condition pre-check in join team (issue 3.1)

- **File:** `src/app/api/hackathons/[slug]/teams/[teamId]/join/route.ts`
- Remove lines 82-91 (slot pre-check), rely on atomic `joinTeam()` `findOneAndUpdate`
- Return 409 if `joinTeam()` returns null

### D2. Fix role validation in auto-assign (issue 3.2)

- **File:** `src/app/api/hackathons/[slug]/teams/auto-assign/route.ts`
- In `getBestRole()`: validate SKILL_TO_ROLE mapping result exists in `hackathon.roles`

### D3. Fix seed script roles (issue 3.3)

- **File:** `scripts/seed-hackathon.ts:44`
- Replace `"DevOps/Deployment"` and `"Data Engineer"` with valid `HackathonRole` values

### D4. Fix auto-assign team naming (issue 3.4)

- **File:** `src/app/api/hackathons/[slug]/teams/auto-assign/route.ts:243`
- Use sequential numbering from existing team count instead of `String.fromCharCode`

### D5. Fix registration status check order (issue 3.5)

- **File:** `src/app/api/hackathons/[slug]/register/route.ts`
- Check deadline before generic status message

### D6. Add date validation (issue 3.6)

- **File:** `src/app/api/hackathons/route.ts`
- Use `validateDate()` helper for `date`, `registrationDeadline`, `teamLockDate`

### D7. Remove global `dbInitialized` flag (issue 3.7)

- **Files:** `src/app/api/hackathons/route.ts`, `src/app/api/auth/register/route.ts`
- Remove `let dbInitialized = false` and guards — `initializeDatabase()` is idempotent

**TDD:** Write `src/app/api/hackathons/__tests__/business-logic.test.ts` — test role validation with invalid/missing roles, date validation, team naming beyond 26 teams.

---

## Phase 4: Performance Fixes (C)

### C1. CRITICAL: Batch N+1 queries in teams endpoint (issue 2.1)

- **File:** `src/app/api/hackathons/[slug]/teams/route.ts:28-42`
- Add `getUsersByIds(ids)` to `src/lib/models/User.ts` — single `$in` query
- Replace per-slot `getUserById()` loop with batch fetch + Map lookup

### C2. CRITICAL: Batch N+1 queries in participants endpoint (issue 2.2)

- **File:** `src/app/api/hackathons/[slug]/participants/route.ts:37-56`
- Add `getProfilesByUserIds(ids)` to `src/lib/models/Profile.ts`
- Replace per-registration queries with two batch `$in` queries

### C3. Optimize auto-assign algorithm (issue 2.3)

- **File:** `src/app/api/hackathons/[slug]/teams/auto-assign/route.ts:135-152`
- Pre-compute available slots by role in a `Map`, update in-place

### C4. Add missing database indexes (issue 2.4)

- **File:** `src/lib/models/HackathonRegistration.ts` — add `userId` and `(hackathonId, involvement)` indexes
- **File:** `src/lib/models/HackathonTeam.ts` — add `"slots.userId"` index

### C5. Memoize AdminKanbanBoard arrays (issue 2.5)

- **File:** `src/components/hackathon/AdminKanbanBoard.tsx`
- Wrap `assignedParticipants` and `allParticipants` with `useMemo`, use `Set` for O(n) dedup

### C6. Add `useCallback` to drag handlers (issue 2.6)

- **File:** `src/components/hackathon/AdminKanbanBoard.tsx`
- Wrap `handleDragStart`, `handleDragEnd`, `handleRemoveMember`, `handleDeleteTeam`

### C7. Memoize `useDroppable` data (issue 2.7)

- **File:** `src/components/hackathon/AdminKanbanBoard.tsx:150-155`
- Wrap the `data` object in `DroppableSlot` with `useMemo`

**TDD:**

- `src/lib/models/__tests__/User.test.ts` — test `getUsersByIds()` with empty array, valid IDs, mixed valid/missing
- `src/lib/models/__tests__/Profile.test.ts` — test `getProfilesByUserIds()` same patterns

---

## Phase 5: Frontend State Management Fixes (E)

### E1. Fix missing useEffect dependencies (issue 4.1)

- **File:** `src/app/hackathon/[slug]/page.tsx:103-107`
- Wrap `checkRegistration` and `fetchData` in `useCallback` with proper deps

### E2. Fix admin auth race condition (issue 4.2)

- **File:** `src/app/hackathon/[slug]/admin/page.tsx:82-107`
- Use `/api/auth/session` endpoint (GET) instead of PATCH with empty body
- Add `AbortController` for cleanup, fix missing `slug` dependency

### E3. Replace hash-based tab routing (issue 4.3)

- **File:** `src/app/hackathon/[slug]/admin/page.tsx:41-50`
- Use Next.js `useSearchParams` for URL-driven tab state

### E4. Add error state to hackathon page (issue 4.4)

- **File:** `src/app/hackathon/[slug]/page.tsx`
- Add `error` state, render error UI with retry button

### E5. Add fetch response validation (issue 4.5)

- **File:** `src/app/hackathon/[slug]/page.tsx:50-55`
- Validate response structure before using data

**TDD:** Write component tests for error state rendering, retry behavior.

---

## Phase 6: Accessibility Fixes (F)

### F1. Add ARIA/keyboard support to modals (issue 5.1)

- **Files:** `CreateTeamModal.tsx`, `EditParticipantModal.tsx`, `HackathonRegistrationForm.tsx`, `HackathonSettingsPanel.tsx`
- Use `@headlessui/react` `<Dialog>` component (already installed) for:
  - `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
  - Escape key to close
  - Focus trapping
  - Click-outside-to-close

### F2. Replace `alert()`/`confirm()` with UI components (issue 5.2)

- **File:** `TeamCardGrid.tsx` — replace 4 `alert()` calls with `toast()`
- **File:** `AdminKanbanBoard.tsx` — replace `confirm()` with `<ConfirmDialog>`, `alert()` with `toast()`

### F3. Fix truncated text accessibility (issue 5.3)

- **File:** `src/app/hackathon/[slug]/admin/page.tsx:254`
- Add `aria-label={p.name}` alongside `title`

**TDD:** Write `src/components/hackathon/__tests__/modal-a11y.test.tsx` — test Escape closes modal, `role="dialog"` present, focus management.

---

## Phase 7: Code Quality Fixes (G)

### G1. Reduce unsafe type casts (issue 6.1)

- **Files:** `HackathonTeam.ts`, `HackathonRegistration.ts`, `Hackathon.ts`
- Define MongoDB document interfaces (`HackathonTeamDoc`, etc.)
- Replace `as unknown as Record<string, unknown>` with typed conversion functions

### G2. Standardize error handling (issue 6.2)

- Ensure all API routes return `{ error: string }` shape consistently
- Ensure all components use state-based error display

### G3. Replace dynamic imports with top-level (issue 6.5)

- **Files:** `register/route.ts:91`, `participants/route.ts:123`
- Move `createProfile` to top-level import (already imported from same module in both files)

### G4. Use `findOne` instead of `find().limit(1)` (issue 6.6)

- **File:** `src/lib/models/HackathonTeam.ts:62-67`
- Replace with `collection.findOne({...}, { sort: { order: -1 } })`

### G5. Memoize sortable context items (issue 6.7)

- **File:** `src/components/hackathon/AdminKanbanBoard.tsx`
- Wrap `columnIds` with `useMemo`

---

## Phase 8: Update Admin Routes to Use Shared Helpers

All 8 admin route files should be updated to:

1. Import `requireAdmin` from `@/lib/auth-helpers`
2. Import `parseJsonBody` and `validateSlug` from `@/lib/validation`
3. Replace inline auth guard with `requireAdmin(request)`
4. Replace `await request.json()` with `parseJsonBody(request)`
5. Add `validateSlug()` at top of GET handlers

**Route files:**

- `src/app/api/hackathons/route.ts`
- `src/app/api/hackathons/[slug]/route.ts`
- `src/app/api/hackathons/[slug]/participants/route.ts`
- `src/app/api/hackathons/[slug]/teams/route.ts`
- `src/app/api/hackathons/[slug]/teams/[teamId]/route.ts`
- `src/app/api/hackathons/[slug]/teams/reorder/route.ts`
- `src/app/api/hackathons/[slug]/teams/auto-assign/route.ts`
- `src/app/api/hackathons/[slug]/teams/[teamId]/join/route.ts`

---

## New Files Created

| File                                  | Purpose                                |
| ------------------------------------- | -------------------------------------- |
| `vitest.config.ts`                    | Test runner config                     |
| `src/test/setup.ts`                   | Test setup (jest-dom matchers)         |
| `.husky/pre-commit`                   | Pre-commit hook (lint-staged)          |
| `.github/workflows/ci.yml`            | CI pipeline (lint + test + build)      |
| `src/lib/validation.ts`               | Shared input validation helpers        |
| `src/lib/auth-helpers.ts`             | Shared auth guard helpers              |
| `src/components/ui/Toast.tsx`         | Toast notification context + component |
| `src/components/ui/ConfirmDialog.tsx` | Accessible confirm dialog              |

## Test Files Created

| File                                                      | Tests                                 |
| --------------------------------------------------------- | ------------------------------------- |
| `src/lib/__tests__/validation.test.ts`                    | ObjectId, JSON, slug, date validation |
| `src/lib/__tests__/auth-helpers.test.ts`                  | Auth guard paths                      |
| `src/lib/models/__tests__/User.test.ts`                   | Batch user fetch                      |
| `src/lib/models/__tests__/Profile.test.ts`                | Batch profile fetch                   |
| `src/app/api/hackathons/__tests__/security.test.ts`       | Endpoint security validation          |
| `src/app/api/hackathons/__tests__/business-logic.test.ts` | Role validation, dates, naming        |
| `src/components/ui/__tests__/Toast.test.tsx`              | Toast rendering + dismiss             |
| `src/components/ui/__tests__/ConfirmDialog.test.tsx`      | Dialog a11y + callbacks               |
| `src/components/hackathon/__tests__/modal-a11y.test.tsx`  | Modal ARIA + keyboard                 |

---

## Verification

After each phase:

1. `npm run test` — all tests pass
2. `npm run lint` — no lint errors
3. `npm run build` — TypeScript compiles, Next.js builds

Final validation: 4. `npm run dev` — manual smoke test of hackathon flows 5. Pre-commit hook triggers on `git commit` 6. Push to branch — GitHub Actions CI runs lint + test + build

---

## Implementation Order

```
Phase 0 → Phase 1 → Phase 8 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
```

Phase 8 (route updates) follows Phase 1 because the shared helpers must exist before routes can use them. Each subsequent phase can be a separate commit or PR.
