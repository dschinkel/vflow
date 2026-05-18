# TDD Skill — Design Spec

> **Plan:** [/tdd Skill Implementation Plan](../../plans/2026-05-17-tdd-skill-design.md)

---

## Overview

A Claude Code skill (`tdd.md`) that acts as a full session conductor for TDD on a single task or sticky. It handles opt-in questions, generates and logs a TDD plan, then actively gates every RED/GREEN/REFACTOR increment through to completion, writing the implementation log as it goes.

Every code-related node in the story map or decision tree auto-invokes this skill. Users can also invoke it directly.

---

## Invocation

```
/tdd "Proceed to checkout"   # explicit task name
/tdd                         # skill asks for task name if omitted
(feature skill auto-invokes) # trigger: any code-related sticky in Phase 4
```

---

## Context Passing — Option A + B Hybrid

Two mechanisms combined to pass context from the feature skill to the TDD skill.

**Option A — argument (primary truth)**
The sticky/task name is always passed as the argument. This is the authoritative source. Works for standalone invocation without any feature skill context.

**Option B — state file (supplementary context)**
The feature skill writes `.tdd-context.json` immediately before invoking the TDD skill (not at session start, not when the sticky is selected — immediately before invoke). This file carries context the argument alone cannot: feature name and story-map path, used to derive the log folder location.

**Staleness prevention:**
- File TTL is exactly one TDD session — written just before invoke, deleted by TDD skill on session end
- Same pattern as `~/.claude/refactor-session.tmp` in the refactor skill
- If argument and state file disagree → halt, surface the discrepancy, ask user which is correct
- If no state file present (standalone invocation) → skill asks user for missing context and proceeds

**Options considered and not selected:**

| Option | Description | Why not selected |
|---|---|---|
| A only | Argument carries all context | Complex argument strings needed for feature name + sticky name |
| B only | State file carries all context | Staleness risk if not written immediately before invoke; hidden coupling |
| C | Skill always asks the user | Breaks auto-invocation UX; user already confirmed the sticky |

---

## Log Location

Derived from context:

```
story-maps/<feature-name>/tdd/<sticky-slug>/   ← when invoked from feature skill
tdd/<task-slug>/                                ← standalone, relative to project root
```

---

## Phase 1 — Opening Questions

Three questions asked in sequence before any plan is generated, one at a time.

### Question 1 — Opt-in

```
Work on "Proceed to checkout" — do you want this TDD'd?
(yes / no)
```

If no → skill exits. No log files created. Feature skill or user continues without TDD.

### Question 2 — Direction (only if yes)

```
Outside-in or inside-out?

  outside-in  — start at the highest layer (UI/hook/controller), work down.
                Tests define the public contract first; lower layers emerge from need.
  inside-out  — start at the lowest layer (domain/data), work up.
                Core logic is solid before wiring up delivery.

Which fits this task better?
```

Answer drives increment ordering in the plan.

**Direction options:**

| Option | Description | Status |
|---|---|---|
| outside-in | Start at highest layer (UI/hook/controller), work down. Tests define the public contract first; lower layers emerge from need. | Default |
| inside-out | Start at lowest layer (domain/data), work up. Core logic is solid before wiring up delivery. | Available |

### Question 3 — Plan review

```
Want to review the TDD plan before I start implementing?
(yes / no)
```

Either answer: plan is always generated and written to `tdd-plan.md`.

- **yes** → plan is shown, explicit approval required before implementation begins. Sets **human-in-the-loop mode** for the session.
- **no** → plan is logged silently and implementation starts immediately. Sets **conductor mode** for the session.

This question controls the autonomy dial for the entire session:

| Mode | Plan review | Commit prompts | Phase gates |
|---|---|---|---|
| Conductor mode | Silent | Auto-commit | None |
| Human-in-the-loop | Show + approve | Ask each time | RED, GREEN, REFACTOR |

---

## Phase 2 — Plan Generation

Plan is generated from the answers to the opening questions before any code is written. Structure is based on GUIDELINES.MD Appendix A.

**Plan structure — one entry per increment:**

```
Task: "Proceed to checkout"
Feature: payments-flow
Direction: outside-in
Layers: Hook → Repository → Domain
Generated: <timestamp>

Increment 1 — <behavior name>
  RED:
    Test name: <prose, domain language, no function names>
    Location: <path/to/test>
    Intent: <one sentence>

  GREEN:
    Minimal implementation: <one sentence>
    Files expected to change: <paths>

  COMMIT: feat: <sticky-slug>: <behavior>

  REFACTOR:
    Invoke: /refactor <files changed during GREEN>
    Candidates: <one sentence or "none anticipated">

  COMMIT (if refactored): feat: <sticky-slug>: refactor: <behavior>

Increment 2 — ...

Cleanup & Verification
  COMMIT: feat: <sticky-slug>: cleanup: <behavior>
```

**Rules baked into plan generation:**

- **Outside-in:** increments ordered highest layer → lowest. Never domain-first.
- **Inside-out:** increments ordered lowest layer → highest.
- **React tasks:** first increment is always the component scaffold — non-TDD, no RED phase. TDD begins at the hook layer (Increment 2 and below).
- **Test names:** prose and domain language only. No function names, no technical patterns, no "should", no framework terms.
- **One behavior per increment:** "and" in a test name means split the increment.

**Plan is always written to `tdd-plan.md`** regardless of whether the user chose to review it.

If human-in-the-loop → plan is shown and explicit approval required before proceeding. If rejected → skill revises and re-presents.

---

## Phase 3 — Session Conduct

The skill drives each increment in sequence using the plan as its guide.

### Conductor mode — no plan review (auto-drives)

```
RED    → write one failing test → run suite → confirm fails for right reason → auto-proceed
GREEN  → write minimal code → run suite → confirm all pass → auto-commit
REFACTOR → invoke /refactor → re-run suite → confirm still green → auto-commit
LOG    → append cycle to tdd-implementation.md → next increment
```

No prompts. No gates. Commits fire automatically. Skill drives straight through all increments.

### Human-in-the-loop mode (user said yes to plan review)

```
RED    → write one failing test → run suite → show failing output → "Proceed to GREEN?"
GREEN  → write minimal code → run suite → show passing output → "Commit? feat: <slug>: <behavior>"
REFACTOR → invoke /refactor → re-run suite → "Commit refactor? feat: <slug>: refactor: <behavior>"
           (user can answer "skip" to skip the refactor commit and move to next increment)
LOG    → append cycle to tdd-implementation.md → next increment
```

### Hard rules — enforced in both modes, no exceptions

- RED must be verified as failing before GREEN starts — never skipped
- Test failure must be for the right reason (missing feature, not a typo or import error)
- GREEN writes only enough to pass the current test — no extra behavior
- REFACTOR only happens while tests are green — if `/refactor` breaks tests, fix before committing
- One test per RED phase — "and" in a test name means split the increment

### React-specific handling

- Increment 1 (component scaffold): no RED phase — skill generates the component layer directly, no test written
- TDD begins at Increment 2 (hook layer) and below
- No tests at the controller layer

### Cleanup & Verification (final step)

```
→ Run full test suite
→ Fix any lint errors
→ Auto-commit (autonomous) OR "Commit cleanup? feat: <slug>: cleanup: <behavior>" (human-in-the-loop)
→ Check off sticky in story-map.md (if invoked from feature skill)
```

---

## Phase 4 — Log Files

Two files written per task in `story-maps/<feature>/tdd/<sticky-slug>/`:

```
story-maps/
  payments-flow/
    story-map.md
    story-map.html
    tdd/
      proceed-to-checkout/
        tdd-plan.md              ← pre-implementation: what we intend to build and how
        tdd-implementation.md    ← post-implementation: what was actually built, cycle by cycle
        refactor-names-<files>-<timestamp>.md
        refactor-names-<files>-<timestamp>-tree.mmd
```

### `tdd-plan.md`

Written once before implementation begins. Never modified after. Full plan structure from Phase 2.

### `tdd-implementation.md`

Appended after each RED/GREEN/REFACTOR cycle completes. Structure borrowed from GUIDELINES.MD Appendix B:

```markdown
# TDD Implementation — Proceed to Checkout

---

## Increment 1 — <behavior name>
PLAN STEP: 1

=== RED ===
TEST ADDED: <path> — <one-line behavior>
OUTPUT: RED — <brief failure summary>

=== GREEN ===
FILES CHANGED: <paths>
OUTPUT: GREEN — all tests passing

=== COMMIT ===
feat: proceed-to-checkout: <behavior>

=== REFACTOR ===
/refactor invoked on: <files>
Refactor log: story-maps/payments-flow/tdd/proceed-to-checkout/refactor-names-<files>-<timestamp>.md
OUTPUT: GREEN — all tests still passing

=== COMMIT (REFACTOR) ===
feat: proceed-to-checkout: refactor: <behavior>

---

## Increment 2 — ...

---

## Cleanup & Verification
All tests passing. Lint clean.
COMMIT: feat: proceed-to-checkout: cleanup: <behavior>
```

The refactor log entry links to the `/refactor` session log by relative path — content is not duplicated.

---

## Rollback Behavior

Triggered by two cases:

| Case | Trigger |
|---|---|
| A — intentional | User says "stop" or "cancel" during any gate prompt |
| B — unexpected | Session ended mid-increment; detected on next session start via `.tdd-context.json` + git status |

### Case A — Intentional exit

When the user says "stop" or "cancel" at any gate:

1. Determine current phase from `.tdd-context.json` (tracks current increment number and phase: RED / GREEN / REFACTOR)
2. Roll back all uncommitted changes for that increment — `git checkout -- <files>` for modified files, delete any new uncommitted files
3. Append an ABANDONED entry to `tdd-implementation.md`:
   ```
   ## Increment <N> — ABANDONED
   Phase at exit: <RED / GREEN / REFACTOR>
   Rolled back: <list of files reverted or deleted>
   ```
4. Delete `.tdd-context.json`
5. Inform user: "Rolled back [what was reverted]. Session ended cleanly."

### Case B — Unexpected termination

Detected at the start of a new session when `.tdd-context.json` exists:

1. Skill detects `.tdd-context.json` on startup
2. Checks git status for uncommitted changes from the interrupted increment
3. Automatically rolls back all uncommitted changes — no prompt, no choice
4. Appends ABANDONED entry to `tdd-implementation.md` (same format as Case A)
5. Deletes `.tdd-context.json`
6. Informs user before the opening questions:
   ```
   A previous TDD session for "Proceed to checkout" was interrupted at
   [RED / GREEN / REFACTOR of Increment N]. Uncommitted changes have been
   rolled back. Starting fresh.
   ```
7. Proceeds with opening questions as normal

### What gets rolled back vs kept

| Artifact | Action |
|---|---|
| Uncommitted test files (mid-RED) | Rolled back |
| Uncommitted production code (mid-GREEN) | Rolled back |
| Uncommitted refactor changes (mid-REFACTOR) | Rolled back |
| Already-committed GREEN commits | Kept — clean commits, untouched |
| `tdd-plan.md` | Kept — pre-implementation artifact, always clean |
| `tdd-implementation.md` partial entries | ABANDONED entry appended, file kept |

### `.tdd-context.json` — additional fields required

The state file must track current phase and increment so rollback knows exactly where the session was:

```json
{
  "feature": "payments-flow",
  "sticky": "Proceed to checkout",
  "storyMapPath": "story-maps/payments-flow/story-map.md",
  "currentIncrement": 2,
  "currentPhase": "GREEN",
  "filesChanged": ["src/hooks/useCheckout.ts", "src/hooks/useCheckout.test.ts"]
}
```

`filesChanged` is updated after each file write so rollback knows exactly which files to revert even if the session ends mid-write.

---

## Refactor Log Location

| Invocation | Refactor log location |
|---|---|
| `/refactor` run manually | `docs/refactorings/<folder>/` (existing behavior, unchanged) |
| `/refactor` invoked by TDD skill | `story-maps/<feature>/tdd/<sticky-slug>/` alongside `tdd-plan.md` and `tdd-implementation.md` |

When the TDD skill invokes `/refactor`, it passes the output path as context so logs land in the feature folder.

**This requires a small update to the `/refactor` skill:** it needs to accept an optional output path override. When present, logs are written there. When absent (manual invocation), existing behavior is unchanged.

---

## Approaches Considered

### Approach 1 — Setup wizard only *(not selected)*

Skill handles opt-in questions, direction choice, plan generation, plan approval, and log file creation only. Then steps back — agent follows TDD from the plan without further gating or logging.

- **Pro:** Lighter, less prescriptive. Good for agents that don't need hand-holding.
- **Con:** No enforcement once implementation starts. No per-cycle logging. Easy for agent to drift.

### Approach 2 — Full session conductor *(selected)*

Skill actively drives the entire session: generates and approves the plan, gates every increment (RED/GREEN/REFACTOR), issues commit prompts, writes the log incrementally as each cycle completes.

- **Pro:** Full enforcement of TDD discipline end-to-end. Complete audit trail. The opt-in question means the user already chose this workflow — the skill carries it all the way through.
- **Con:** More friction per increment. Heavier for simple stickies with one or two increments.

### Approach 3 — Plan-heavy with all increments upfront *(not selected)*

All RED/GREEN/REFACTOR increments for the entire sticky are mapped out in the plan before a single line of code is written. User approves the full multi-increment plan, then skill gates each step.

- **Pro:** Maximum deliberateness. Full picture visible before implementation starts. Closest to proven GUIDELINES.MD workflow.
- **Con:** Over-engineered for simple stickies. Rigid upfront decomposition fights natural TDD discovery — later increments often reveal themselves during earlier ones.

---

## What This Spec Does Not Cover

- How the TDD skill composes with `/hexagonal` (also auto-invoked in Phase 4 of the feature skill)
- Multi-language test runner detection (Jest vs pytest vs go test)
- Handling test suite failures unrelated to the current increment
