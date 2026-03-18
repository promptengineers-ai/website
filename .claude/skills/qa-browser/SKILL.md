---
name: qa-browser
description: |
  Browser-based QA testing using agent-browser CLI.
  Triggers on: qa test, browser test, agent-browser, validate feature.
---

# QA Browser Testing Skill

## Purpose
Provides contextual knowledge and patterns for browser-based QA testing using the `agent-browser` CLI. This skill helps you execute reliable end-to-end test flows, handle common failure modes, and produce structured test evidence.

## Instructions

### 1. Start a Session
```bash
agent-browser open http://localhost:3000/<route> --session <persona> --headed
```
Each persona (alice, bob, carol, admin) gets their own session to maintain independent browser state.

### 2. Discover Elements
```bash
agent-browser snapshot --session <persona> --headed
```
This returns the full DOM tree with `@e<N>` references. Use these refs in subsequent commands.

**Important**: Always re-snapshot before interacting. Refs are invalidated by any DOM change.

### 3. Interact with Elements
```bash
agent-browser click @e<N> --session <persona> --headed
agent-browser fill @e<N> "value" --session <persona> --headed
agent-browser select @e<N> "option text" --session <persona> --headed
```

### 4. Handle Failures
If `click @ref` fails (especially on animated buttons):
```bash
agent-browser eval "document.querySelector('button.target-class').click()" --session <persona> --headed
```

### 5. Capture Evidence
```bash
agent-browser screenshot specs/screenshots/<NN>-<persona>-<action>.png --session <persona> --headed
# Use --full for scrollable pages:
agent-browser screenshot specs/screenshots/<NN>-<persona>-<action>.png --session <persona> --headed --full
```

### 6. Wait for Transitions
```bash
agent-browser wait 2000 --session <persona> --headed
```
Use after form submissions, page navigations, and modal opens/closes.

## Examples

### Example 1: Fill and Submit a Form
```bash
# Snapshot to get refs
agent-browser snapshot --session alice --headed
# Fill form fields (using refs from snapshot output)
agent-browser fill @e5 "Alice Smith" --session alice --headed
agent-browser fill @e7 "alice@example.com" --session alice --headed
agent-browser fill @e9 "Password123!" --session alice --headed
agent-browser fill @e11 "Password123!" --session alice --headed
# Submit
agent-browser click @e13 --session alice --headed
# Wait for redirect
agent-browser wait 2000 --session alice --headed
# Capture result
agent-browser screenshot specs/screenshots/03-alice-post-signup.png --session alice --headed
```

### Example 2: Animated Button Fallback
```bash
# Standard click fails on pulsing CTA button
agent-browser click @e3 --session bob --headed
# → Error or no response

# Fallback: use eval with CSS selector
agent-browser eval "document.querySelector('a[href*=\"register\"], button.animate-pulse-grow-shrink, [class*=\"pulse\"]').click()" --session bob --headed
# Wait for navigation
agent-browser wait 2000 --session bob --headed
```

### Example 3: Disambiguating Identical Buttons
```bash
# Page has multiple "Join" buttons (one per team slot)
# BAD: snapshot -i shows multiple "Join" with no context
agent-browser snapshot -i --session carol --headed

# GOOD: full snapshot shows surrounding context (team name, role label)
agent-browser snapshot --session carol --headed
# Now you can identify @e18 = "Join" under "Team Alpha > Backend Engineer"
# vs @e23 = "Join" under "Team Beta > Frontend Developer"
agent-browser click @e18 --session carol --headed
```

## Guidelines

- **Always re-snapshot** before clicking, filling, or selecting — refs are ephemeral
- **Use full `snapshot`** over `snapshot -i` when the page has repeated patterns
- **Use `eval` fallback** for animated or overlaid elements that resist `click @ref`
- **Check current state** before asserting counts — seeded data may already exist
- **Screenshot every step** — screenshots are your test evidence
- **Use `--full`** flag for pages that scroll (team boards, admin dashboards, long forms)
- **Name screenshots consistently**: `<NN>-<persona>-<action>.png`

## Command Reference

| Command | Purpose |
|---------|---------|
| `open <url>` | Navigate to URL, start session |
| `snapshot` | Full page element tree with `@e<N>` refs |
| `snapshot -i` | Interactive elements only (less context) |
| `click @e<N>` | Click element |
| `fill @e<N> "text"` | Type into input |
| `select @e<N> "option"` | Choose dropdown option |
| `eval "js code"` | Execute JavaScript (fallback for tricky elements) |
| `scroll down <px>` | Scroll page |
| `wait <ms>` | Pause for transitions |
| `screenshot <path>` | Capture viewport (`--full` for entire page) |
