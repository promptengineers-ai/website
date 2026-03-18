---
name: Feature Request
about: Propose a new feature with enough detail for autonomous agent implementation
title: "feat: "
labels: enhancement
assignees: ""
---

## Metadata

> **IMPORTANT**: The very first step should _ALWAYS_ be validating this metadata section to maintain a **CLEAN** development workflow.

```yml
pull_request_title: "FROM feat/[issue#]-[shortdesc] TO development"
branch: "feat/[issue#]-[shortdesc]"
worktree_path: "$WORKSPACE/.worktrees/feat-[issue#]"
```

---

## User Stories

<!-- Define the feature from the user's perspective FIRST. Every story follows the format:
     "As a [role], I want [capability] so that [benefit]."
     These stories drive all downstream decisions — integration points, UI, and acceptance criteria. -->

- As a **[role]**, I want **[capability]** so that **[benefit]**.
- As a **[role]**, I want **[capability]** so that **[benefit]**.

---

## Summary

<!-- Brief context beyond the user stories. Include visual references if applicable. -->

### Visual Reference

<!-- Screenshots, mockups, or links to reference implementations. -->

---

## Key Integration Points

<!-- Backend files/functions that need changes. Describe the ROLE each plays. -->

| File                 | Function(s)       | Role                                       |
| -------------------- | ----------------- | ------------------------------------------ |
| `src/app/api/...`    | `handler()`       | _e.g., New API route for feature_          |
| `src/lib/models/...` | `function_name()` | _e.g., CRUD operations for new collection_ |

---

## UI Integration Points

<!-- Which existing frontend components are modified or extended? Where does the new UI live? -->

| Component / Route                       | Change Type | Description                      |
| --------------------------------------- | ----------- | -------------------------------- |
| _e.g., `src/components/nav/Navbar.tsx`_ | Modify      | _e.g., Add nav link to new page_ |
| _e.g., `src/app/new-page/page.tsx`_     | New page    | _e.g., Dedicated feature page_   |

---

## Storage

<!-- Where and how is data persisted? Specify the pattern to follow. -->

- **Persistence layer**: <!-- MongoDB via native driver (`src/lib/mongodb.ts`) -->
- **Collection**: <!-- e.g., `features` -->
- **Model pattern**: <!-- CRUD functions in `src/lib/models/` following existing patterns -->

---

## Architectural Decisions

<!-- Explicit decisions that prevent misinterpretation. State the source of truth, state management approach, etc. -->

- **Source of truth**: <!-- e.g., MongoDB — NOT localStorage -->
- **State management**: <!-- e.g., React Context via AuthProvider, or local useState + useEffect fetch -->
- **Auth / scoping**: <!-- e.g., Protected by requireAuth() middleware, user-scoped via JWT claims -->

---

## Design Principles

- Simplicity is beauty, complexity is pain.
- _ALWAYS_ look at the current codebase first — achieve the goal in the **least amount of changes**.
- TDD-first: write tests before implementation.
- Follow existing patterns: native MongoDB driver (no ORM), Tailwind CSS only, App Router conventions.
- <!-- Add any feature-specific principles here -->

---

## Out of Scope

<!-- Anything explicitly NOT part of this feature to keep the agent focused. -->

---

## Acceptance Criteria

<!-- Every criterion must be binary — testable by an agent with a pass/fail outcome. Avoid subjective language. -->

- [ ] Implementation plan is thoroughly documented
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (new tests added if applicable)
- [ ] `npm run build` succeeds
- [ ] New code follows existing repo patterns (`src/lib/models/` for data, `src/app/api/` for routes, Tailwind for styles)
- [ ] No new dependencies added beyond what's already in the project (or justified in PR description)
- [ ] Draft PR opened: `FROM feat/[issue#]-[shortdesc] TO development`
- [ ] <!-- Add feature-specific criteria -->
