---
description: Use when user runs /tdd, says "TDD this task", asks to drive a RED/GREEN/REFACTOR cycle, or is auto-invoked by /feature on a code-related sticky.
allowed-tools: "Read Edit Write Bash"
---

# TDD Skill

A session conductor for test-driven development on a single task or sticky. Drives opening questions → plan generation → RED/GREEN/REFACTOR cycles → final cleanup. Writes a `tdd-plan.md` before any code and appends to `tdd-implementation.md` after every cycle. Auto-invokes `/refactor` during the REFACTOR phase.

> **Recommended model:** `claude-opus-4-7` — TDD requires judgment about test boundaries, increment ordering, and refactor candidates. Opus handles this better than Sonnet.
> To switch: `/model claude-opus-4-7`

---

## Invocation

```
/tdd "Proceed to checkout"   # explicit task/sticky name
/tdd                         # skill asks for task name if omitted
(feature skill auto-invokes) # trigger: any code-related sticky in Phase 4 of /feature
```

---

## On Start — Context Resolution and Rollback Check

Execute these checks in order, before asking any opening questions.

### Step 1 — Check for prior interrupted session

If `.tdd-context.json` exists in the project root, a previous TDD session was interrupted. Perform **Rollback Case B** (see Rollback Behavior below) before doing anything else. Then continue to Step 2.

### Step 2 — Resolve task name and feature context

Two sources, combined:

- **Argument (primary truth):** the sticky/task name passed after `/tdd`. If absent, ask the user: *"What task are we TDD-ing? Give me a short name."* Use the user's answer as the task name.
- **State file (supplementary):** if the feature skill wrote `.tdd-context.json` before invoking, read `feature` and `storyMapPath` from it.

**Disagreement handling:**
- If both the argument and the state file's `sticky` field are present and they disagree, halt. Show both values and ask: *"The argument says '<arg>' but the state file says '<state-sticky>'. Which is correct?"* Use the user's choice and update the state file to match.
- If only the argument is present (no state file), proceed as standalone — no feature context.

### Step 3 — Derive the log folder

| Source | Log folder |
|---|---|
| Feature-invoked (state file present) | `story-maps/<feature>/tdd/<sticky-slug>/` |
| Standalone (no state file) | `tdd/<task-slug>/` (relative to project root) |

`<sticky-slug>` and `<task-slug>` are kebab-case versions of the task name (lowercase, spaces → `-`, strip punctuation).

Create the folder if it doesn't exist.

### Step 4 — Write or update `.tdd-context.json`

Write the state file at the project root with the resolved context. Schema:

```json
{
  "feature": "<feature-name or null>",
  "sticky": "<task name>",
  "storyMapPath": "<path or null>",
  "logFolder": "<derived log folder>",
  "currentIncrement": 0,
  "currentPhase": "INIT",
  "filesChanged": []
}
```

Update `currentIncrement`, `currentPhase`, and `filesChanged` after each transition. This is the rollback ground truth.

---

## Phase 1 — Opening Questions

Three questions, asked in sequence. Wait for each answer before asking the next.

### Question 1 — Opt-in

```
Work on "<task name>" — do you want this TDD'd?
(yes / no)
```

- **no** → delete `.tdd-context.json`, print *"Skipping TDD. Continue however you'd like."*, exit cleanly. No log files written.
- **yes** → proceed to Question 2.

### Question 2 — Direction

```
Outside-in or inside-out?

  outside-in  — start at the highest layer (UI/hook/controller), work down.
                Tests define the public contract first; lower layers emerge from need.
  inside-out  — start at the lowest layer (domain/data), work up.
                Core logic is solid before wiring up delivery.

Which fits this task better?
```

Record the answer. Drives increment ordering in the plan.

### Question 3 — Plan review

```
Want to review the TDD plan before I start implementing?
(yes / no)
```

- **yes** → human-in-the-loop mode for the rest of the session.
- **no** → conductor mode for the rest of the session.

The plan itself is always generated and written to `tdd-plan.md` regardless of the answer. The question only controls whether the plan (and subsequent phase transitions) are gated by user approval.

---

## Phase 2 — Plan Generation

Generated from the answers to Phase 1 before any code is written.

### Plan file location

`<log folder>/tdd-plan.md`

### Plan structure

```markdown
# TDD Plan — <task name>

Task: <task name>
Feature: <feature-name or "standalone">
Direction: <outside-in | inside-out>
Layers: <derived from direction and task — e.g., Hook → Repository → Domain>
Generated: <ISO 8601 timestamp>

---

## Increment 1 — <behavior name in domain language>

RED:
  Test name: <prose, domain language, no function names>
  Location: <path/to/test/file>
  Intent: <one sentence — what behavior this proves>

GREEN:
  Minimal implementation: <one sentence>
  Files expected to change: <paths>

COMMIT: feat: <sticky-slug>: <behavior>

REFACTOR:
  Invoke: /refactor <files changed during GREEN> --output <log folder>
  Candidates: <one sentence or "none anticipated">

COMMIT (if refactored): feat: <sticky-slug>: refactor: <behavior>

---

## Increment 2 — ...

(repeat as many increments as the task warrants)

---

## Cleanup & Verification

- Run full test suite — must pass.
- Lint must be clean.
- If invoked from /feature: check off the sticky in story-map.md.

COMMIT: feat: <sticky-slug>: cleanup: <behavior>
```

### Rules baked into plan generation

- **Outside-in:** increments ordered highest layer → lowest. Never domain-first.
- **Inside-out:** increments ordered lowest layer → highest.
- **React tasks:** Increment 1 is always the component scaffold — non-TDD, no RED phase. TDD begins at the hook layer (Increment 2 and below). No tests at the controller layer.
- **Test names:** prose and domain language only. No function names, no technical patterns, no "should", no framework terms (e.g. `describe`, `it`).
- **One behavior per increment:** an "and" in a test name means split the increment.
- **Always write the plan**, even if the user chose not to review it.

### Plan review gate

- **Conductor mode:** plan is written silently. Skill proceeds straight to Phase 3.
- **Human-in-the-loop:** plan is shown in full and the user is asked:
  ```
  Plan approved? (yes / revise / cancel)
  ```
  - **yes** → proceed to Phase 3.
  - **revise** → ask what to change, regenerate the plan, re-present.
  - **cancel** → delete `.tdd-context.json`, exit cleanly. Plan file is kept on disk.

---

## Phase 3 — Session Conduct

Drive every increment in sequence using the plan as the guide. Update `.tdd-context.json` (`currentIncrement`, `currentPhase`, `filesChanged`) after each transition.

### Mode comparison

| Mode | Plan review | Commit prompts | Phase gates |
|---|---|---|---|
| Conductor mode | Silent | Auto-commit | None |
| Human-in-the-loop | Show + approve | Ask each time | RED, GREEN, REFACTOR |

### Conductor mode — fully autonomous

```
RED      → write one failing test → run suite → confirm fails for right reason → auto-proceed
GREEN    → write minimal code → run suite → confirm all pass → auto-commit
REFACTOR → invoke /refactor with --output <log folder> → re-run suite → confirm still green → auto-commit
LOG      → append cycle entry to tdd-implementation.md → next increment
```

No prompts. No gates. Commits fire automatically.

### Human-in-the-loop mode

```
RED      → write one failing test → run suite → show failing output → "Proceed to GREEN?"
GREEN    → write minimal code → run suite → show passing output → "Commit? feat: <slug>: <behavior>"
REFACTOR → invoke /refactor with --output <log folder> → re-run suite →
           "Commit refactor? feat: <slug>: refactor: <behavior>"
           (user can answer "skip" to skip the refactor commit and move to next increment)
LOG      → append cycle entry to tdd-implementation.md → next increment
```

If the user answers "stop" or "cancel" at any prompt, perform **Rollback Case A**.

### Hard rules — enforced in both modes

- RED must be verified as failing before GREEN starts — never skipped.
- A test failure must be for the *right reason* (missing feature, not a typo or import error). If wrong-reason failure, fix the test and rerun before declaring RED.
- GREEN writes only enough to pass the current test — no extra behavior.
- REFACTOR only happens while tests are green. If `/refactor` breaks tests, fix before committing.
- One test per RED phase — an "and" in a test name means split the increment.

### React-specific handling

- Increment 1 (component scaffold): no RED phase. Write the component layer directly.
- TDD begins at Increment 2 (hook layer) and below.
- No tests at the controller layer.

### Cleanup & Verification (final increment)

```
→ Run full test suite
→ Fix any lint errors
→ Conductor mode: auto-commit
  Human-in-the-loop: "Commit cleanup? feat: <slug>: cleanup: <behavior>"
→ If invoked from /feature: check off the sticky in <storyMapPath>
→ Delete .tdd-context.json
→ Print: "TDD complete for '<task name>'. Log: <log folder>/tdd-implementation.md"
```

---

## Phase 4 — Log Files

Two files, both inside the log folder.

### `tdd-plan.md`

Written once at the end of Phase 2. Never modified after. Full structure shown in Phase 2.

### `tdd-implementation.md`

Initialized at the start of Phase 3 with a header. Appended to after each cycle completes.

**Header (written once):**

```markdown
# TDD Implementation — <task name>

Feature: <feature-name or "standalone">
Direction: <outside-in | inside-out>
Started: <ISO 8601 timestamp>

---
```

**Per-increment entry (appended after each cycle):**

```markdown
## Increment <N> — <behavior name>
PLAN STEP: <N>

=== RED ===
TEST ADDED: <path> — <one-line behavior>
OUTPUT: RED — <brief failure summary>

=== GREEN ===
FILES CHANGED: <paths>
OUTPUT: GREEN — all tests passing

=== COMMIT ===
feat: <sticky-slug>: <behavior>

=== REFACTOR ===
/refactor invoked on: <files>
Refactor log: <relative path to refactor-names-...md>
OUTPUT: GREEN — all tests still passing

=== COMMIT (REFACTOR) ===
feat: <sticky-slug>: refactor: <behavior>

---
```

If the REFACTOR phase was skipped (user said "skip" or no candidates), omit the two REFACTOR blocks for that increment.

**Final entry (appended after Cleanup & Verification):**

```markdown
## Cleanup & Verification
All tests passing. Lint clean.
COMMIT: feat: <sticky-slug>: cleanup: <behavior>
```

### Refactor log linking

The refactor log written by `/refactor` lands inside the log folder (because `/tdd` passes `--output <log folder>`). Link to it by **relative path** in the implementation log — do not duplicate content.

---

## Rollback Behavior

Two cases.

| Case | Trigger |
|---|---|
| A — intentional | User says "stop" or "cancel" at any gate prompt during Phase 3 |
| B — unexpected | `.tdd-context.json` is present at session start (previous session ended mid-increment) |

### Case A — Intentional exit

When the user says "stop" or "cancel" at any Phase 3 gate:

1. Read `currentIncrement`, `currentPhase`, and `filesChanged` from `.tdd-context.json`.
2. Roll back every entry in `filesChanged`:
   - If the file exists in HEAD: `git checkout -- <file>`
   - If the file is new (not in HEAD): delete it.
3. Append an ABANDONED entry to `tdd-implementation.md`:
   ```markdown
   ## Increment <N> — ABANDONED
   Phase at exit: <RED | GREEN | REFACTOR>
   Rolled back: <comma-separated list of files reverted or deleted>
   ```
4. Delete `.tdd-context.json`.
5. Print: *"Rolled back <files>. Session ended cleanly. Log preserved at <log folder>/tdd-implementation.md."*
6. Exit.

### Case B — Unexpected termination (detected on next startup)

When `.tdd-context.json` exists at the very start of a new `/tdd` invocation:

1. Read `currentIncrement`, `currentPhase`, and `filesChanged` from `.tdd-context.json`.
2. Run `git status --porcelain` to confirm uncommitted changes exist among `filesChanged`.
3. Roll back automatically — no prompt, no choice. Same git operations as Case A step 2.
4. Append an ABANDONED entry to `tdd-implementation.md` (same format as Case A).
5. Delete `.tdd-context.json`.
6. Print to the user before opening questions:
   ```
   A previous TDD session for "<task name>" was interrupted at
   <currentPhase> of Increment <N>. Uncommitted changes have been
   rolled back. Starting fresh.
   ```
7. Continue with normal `/tdd` startup (Step 2 onwards).

### What gets rolled back vs kept

| Artifact | Action |
|---|---|
| Uncommitted test files (mid-RED) | Rolled back |
| Uncommitted production code (mid-GREEN) | Rolled back |
| Uncommitted refactor changes (mid-REFACTOR) | Rolled back |
| Already-committed GREEN commits | Kept — clean commits, untouched |
| `tdd-plan.md` | Kept — pre-implementation artifact, always clean |
| `tdd-implementation.md` partial entries | ABANDONED entry appended, file kept |

---

## Error Handling

- **No argument and user supplies no name** → halt with: *"I need a task name to proceed. Try `/tdd \"Your task name\"`."*
- **Disagreement between argument and state file** → halt and ask which is correct (see On Start, Step 2).
- **Log folder cannot be created** → halt with the underlying error. Do not proceed without a log destination.
- **Test runner not detected (no `package.json` test script, no `pytest`, no `go test` config)** → ask the user: *"How do I run the tests for this project?"* Use the user's command verbatim for all suite runs in this session.
- **`/refactor` invocation fails** → leave the REFACTOR phase incomplete, surface the error, skip to next increment (do not commit). User can re-invoke `/refactor` manually after the session.

---

## Composition with Other Skills

- `/refactor` is invoked during the REFACTOR phase with `--output <log folder>` so refactor artifacts land alongside the implementation log.
- `/feature` (future skill) auto-invokes `/tdd` per code-related sticky and writes `.tdd-context.json` immediately before doing so.
- Standalone invocation (no state file) is fully supported — the skill prompts for the task name and uses the standalone log folder layout.
