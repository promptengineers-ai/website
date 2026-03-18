# QA: Browser-Based Testing

## Variables
- `TEST_PLAN`: $ARGUMENTS

## Workflow

### 1. _DETERMINE_ Scope
- Parse `$TEST_PLAN` to identify which features/flows to test
- If no plan specified, read the most recent PR diff to determine test scope
- Identify personas needed (participant, volunteer, mentor, admin)

### 2. _READ_ Memory for Patterns
- Read `~/.claude/projects/-home-ryaneggz-promptengineers-ai-website/memory/feedback_agent-browser-quirks.md` for known workarounds
- Read `~/.claude/projects/-home-ryaneggz-promptengineers-ai-website/memory/reference_agent-browser-cli.md` for command reference
- Apply workarounds proactively (don't wait for failures)

### 3. _VERIFY_ Prerequisites
- Dev server running at `localhost:3000`
- `agent-browser` CLI available
- Screenshot directory exists (`specs/screenshots/`)
- Database seeded if needed (`scripts/seed-hackathon.ts`)

### 4. _EXECUTE_ Steps with Fallback Handling
For each test step:
1. `snapshot` → identify element → `click`/`fill`/`select` → `screenshot`
2. If `click @ref` fails on animated element → fallback to `eval "document.querySelector('...').click()"`
3. If element not found → re-snapshot (refs are ephemeral)
4. If multiple identical elements → use full `snapshot` instead of `snapshot -i`
5. Wait 1-3 seconds after form submissions and page navigations

### 5. _CAPTURE_ Screenshots
- Name: `<NN>-<persona>-<action>.png`
- Use `--full` for scrollable pages (team boards, dashboards, long forms)
- Store in `specs/screenshots/`

### 6. _VERIFY_ Admin State
- After all persona flows, login as admin
- Navigate to admin dashboard
- Confirm all registrations, team assignments, and role changes are correct
- Take final screenshot as evidence

## Report Format
```
## QA Report: {test_plan}

**Date**: {date}
**Personas tested**: {list}

### Results
| # | Step | Status | Screenshot | Notes |
|---|------|--------|------------|-------|
| 1 | ... | PASS/FAIL | path | ... |

### Workarounds Used
- {description}: {reason}

### Bugs Found
- {description}: {steps to reproduce}

### Screenshots
Total: {N} screenshots in `specs/screenshots/`
```
