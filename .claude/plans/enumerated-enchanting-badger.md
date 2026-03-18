# Session Reflection: QA Testing Learnings → Reusable Artifacts

## Context

We completed a 38-screenshot browser-based QA session testing the hackathon feature (PR #9) using `agent-browser` CLI v0.8.5. The session uncovered critical workarounds and patterns that should be encoded as reusable infrastructure so future QA sessions run smoother. This plan creates memory files, an agent, a command, and a skill based on those learnings.

---

## Key Learnings to Encode

1. **`click @ref` fails on animated buttons** — Use `eval "document.querySelector('...').click()"` fallback
2. **`@ref` values are ephemeral** — Always re-snapshot before interacting
3. **`snapshot -i` lacks context** — Use full `snapshot` to disambiguate identical elements (e.g., multiple "Join" buttons)
4. **Pre-seeded data skews counts** — Query current state before asserting expected values

---

## Deliverables (8 files)

### Part 1: Directory Creation

```
mkdir -p .claude/agents/
mkdir -p .claude/skills/qa-browser/
# Memory directory already exists at ~/.claude/projects/.../memory/
```

### Part 2: Memory Files (4 files)

**Location**: `/home/ryaneggz/.claude/projects/-home-ryaneggz-promptengineers-ai-website/memory/`

| File | Type | Content |
|------|------|---------|
| `user_role.md` | user | Ryan — AI community leader (1,700+ members), full-stack Next.js/TS/MongoDB, prefers browser-based QA validation, uses Claude Code agent ecosystem |
| `feedback_agent-browser-quirks.md` | feedback | 4 friction points: click failures on animated buttons (use eval), ephemeral refs (re-snapshot), snapshot -i lacks context (use full snapshot), seeded data skews counts |
| `reference_agent-browser-cli.md` | reference | Quick reference: core commands table (open/snapshot/click/fill/select/eval/screenshot/scroll), session management, selector priority order, multi-persona testing pattern |
| `MEMORY.md` | index | Links to the 3 memory files above, organized by topic |

### Part 3: Agent — `.claude/agents/qa-browser.md`

```yaml
---
name: qa-browser
description: |
  Browser-based QA testing specialist using agent-browser CLI.
  Use when running end-to-end QA flows, validating UI features,
  or executing multi-persona test plans.
tools: Read, Glob, Grep, Bash
model: sonnet
---
```

**Sections**:
- Role definition (browser QA specialist)
- Project context (Next.js 14, form selectors, hackathon routes, screenshot dir)
- QA Execution Protocol (5 steps: prerequisites → session setup → per-step execution → evidence capture → report)
- Known Workarounds (the 4 learnings above)
- Quality Standards (every step gets screenshot, consistent naming, error documentation)

### Part 4: Command — `.claude/prompts/qa.md`

Follows existing `prompts/` convention (not `commands/`). Uses action verb pattern from command-builder.

**Structure**:
- Variables: `TEST_PLAN: $ARGUMENTS`
- Workflow: `_DETERMINE_` scope → `_READ_` memory for patterns → `_VERIFY_` prerequisites → `_EXECUTE_` steps with fallback handling → `_CAPTURE_` screenshots → `_VERIFY_` admin state
- Report: Steps executed/passed/failed, screenshot paths, workarounds used, bugs found

### Part 5: Skill — `.claude/skills/qa-browser/SKILL.md`

```yaml
---
name: qa-browser
description: |
  Browser-based QA testing using agent-browser CLI.
  Triggers on: qa test, browser test, agent-browser, validate feature.
---
```

**Sections**: Purpose, Instructions (6 steps), 3 Examples (form fill, animated button fallback, disambiguating identical buttons), Guidelines, Command reference table

---

## Execution Order

| Step | File | Depends On |
|------|------|------------|
| 1 | Create directories (`agents/`, `skills/qa-browser/`) | — |
| 2-4 | Memory files (3 files, parallel) | Step 1 |
| 5 | `MEMORY.md` | Steps 2-4 |
| 6-8 | Agent, Command, Skill (parallel) | Step 5 |

---

## Design Decisions

- **Agent tools = Read, Glob, Grep, Bash** — No Edit/Write; QA agent runs `agent-browser` via Bash but shouldn't modify source code
- **Agent model = sonnet** — Needs reasoning for element discovery, fallback decisions, test flow logic
- **`prompts/` not `commands/`** — Follows existing project convention (task-code-review.md is in prompts/)
- **Skill + Agent overlap is intentional** — Skill provides contextual knowledge (auto-loaded); Agent provides autonomous execution context (separate window)
- **Memory is user-level** — Lives at `~/.claude/projects/`, not in repo's `.claude/` (memory is personal; agents/skills/commands are team-sharable)

## Verification

1. After creating memory files, verify `MEMORY.md` links are correct
2. After creating agent, test: ask Claude to "use the qa-browser agent to test the signup flow"
3. After creating command, test: `/qa signup flow for new user`
4. After creating skill, verify it appears in available skills list
