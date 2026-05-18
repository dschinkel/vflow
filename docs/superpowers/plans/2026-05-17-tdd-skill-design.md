# /tdd Skill Implementation Plan

> **Spec:** [TDD Skill — Design Spec](../specs/skills/2026-05-17-tdd-skill-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `/tdd` Claude Code command as a full session conductor for TDD on a single task/sticky, plus a small `/refactor` extension that lets `/tdd` redirect refactor logs into the feature folder.

**Architecture:** Two markdown changes, no runtime code. `commands/tdd.md` is a new skill file that contains every prompt, format, and rule the model needs to drive an opt-in → plan → RED/GREEN/REFACTOR → log cycle. `commands/refactor.md` gains an optional `--output <dir>` argument so `/tdd` can redirect its refactor logs to `story-maps/<feature>/tdd/<sticky>/`. Both files are mirrored to `.claude/commands/` (project convention).

**Tech Stack:** Markdown skill files, Claude Code commands. No new hooks, no new tests (the skill body is a prompt; existing `/refactor` hook tests are unaffected).

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `commands/tdd.md` | Create | The `/tdd` skill — frontmatter, invocation, all 4 phases, rollback |
| `.claude/commands/tdd.md` | Create | Local mirror of `commands/tdd.md` |
| `commands/refactor.md` | Modify | Accept optional `--output <dir>` argument |
| `.claude/commands/refactor.md` | Modify | Local mirror of `commands/refactor.md` |
| `docs/superpowers/specs/2026-05-17-tdd-skill-design.md` | Modify | Replace the plan-link placeholder at the top |

No new hooks. No new bash tests. The spec does not require a context-window guard or a Stop hook; both can be added in a future iteration if needed.

---

## Implementation Decisions Locked Down

These are details left open by the spec that the plan must commit to before writing the skill:

1. **`/refactor --output` syntax.** When `/tdd` invokes `/refactor`, it appends `--output <dir>` to the command. If present, `/refactor` uses `<dir>` as the output directory (verbatim, no `docs/refactorings/<folder>/` prefix). Filenames are unchanged. If absent, current behavior is preserved.
2. **`.tdd-context.json` location.** Project root (same convention as `.claude/` artifacts). `.gitignore` already covers session output, but we'll add an explicit entry for `.tdd-context.json` to be safe.
3. **Rollback detection.** Done by the `/tdd` skill itself on startup (first action after invocation). No hook required.
4. **State file lifecycle.** Written by the feature skill (future work) or by `/tdd` itself when no state file is present and the user supplies context interactively. Always deleted by `/tdd` on session end (clean exit, abandon, or rollback).
5. **Standalone vs feature-invoked log location.** Spec says `tdd/<task-slug>/` for standalone (relative to project root) and `story-maps/<feature>/tdd/<sticky-slug>/` for feature-invoked. The skill derives the path from `.tdd-context.json` (if present) or generates a task slug from the argument.

---

## Task 1: Cross-link spec → plan

**Files:**
- Modify: `docs/superpowers/specs/2026-05-17-tdd-skill-design.md:3`

- [ ] **Step 1: Replace the plan-link placeholder**

The spec currently reads:

```markdown
# TDD Skill — Design Spec

> **Plan:** _link to be added when implementation plan is written_
```

Change line 3 to:

```markdown
> **Plan:** [/tdd Skill Implementation Plan](../plans/2026-05-17-tdd-skill-design.md)
```

- [ ] **Step 2: Verify the link resolves**

Run:
```bash
ls docs/superpowers/plans/2026-05-17-tdd-skill-design.md
```
Expected: file exists (this plan was created in the parent step).

- [ ] **Step 3: Do not commit yet** — bundled with Task 5.

---

## Task 2: Add `--output <dir>` override to `/refactor`

**Files:**
- Modify: `commands/refactor.md`

- [ ] **Step 1: Update the Invocation section to document the new flag**

Find this block in `commands/refactor.md`:

```markdown
## Invocation

```
/refactor @<file-or-folder>
```

The `@` reference is required. If omitted, stop and ask for one before doing anything else.
```

Replace with:

```markdown
## Invocation

```
/refactor @<file-or-folder> [--output <dir>]
```

The `@` reference is required. If omitted, stop and ask for one before doing anything else.

The optional `--output <dir>` flag overrides the default output directory. When present, all session artifacts (the flat log and the tree diagram) are written directly inside `<dir>` using the same filenames described below. When absent, the default `docs/refactorings/<folder>/` layout is used unchanged. This flag exists so other skills (e.g. `/tdd`) can redirect refactor logs into their own feature folder.
```

- [ ] **Step 2: Update step 3 of "On Start" to honor the override**

Find the `## On Start` block step 3 (begins `Determine the output path from the @ reference`). Add a new bullet at the very top of step 3:

```markdown
3. Determine the output path:
   - **If `--output <dir>` was provided:** use `<dir>` verbatim as the output directory. Skip the `<folder>` derivation below. Filenames (log and tree) are computed exactly the same way as the default flow.
   - **Otherwise — derive from the `@` reference:**
     - **Single file** (e.g., `src/utils/prompt.ts`):
       - `<folder>` = immediate parent directory name (e.g., `utils`)
       - `<stem>` = filename without extension (e.g., `prompt`)
       - Output dir: `docs/refactorings/<folder>/`
       - Log filename: `refactor-names-<folder>-<stem>-<timestamp>.md`
       - Tree filename: `refactor-names-<folder>-<stem>-<timestamp>-tree.mmd`
     - **Folder** (e.g., `src/utils/`):
       - `<folder>` = the target folder name (e.g., `utils`)
       - Output dir: `docs/refactorings/<folder>/`
       - Log filename: `refactor-names-<folder>-<timestamp>.md`
       - Tree filename: `refactor-names-<folder>-<timestamp>-tree.mmd`

   Create the output directory if it doesn't exist.
```

(This preserves the existing rules for the no-override case and adds the override branch first.)

- [ ] **Step 3: Do not commit yet** — bundled with Task 5.

---

## Task 3: Create the `/tdd` skill — full file

**Files:**
- Create: `commands/tdd.md`

- [ ] **Step 1: Write `commands/tdd.md` in one shot**

Write the file with exactly this content:

````markdown
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
````

- [ ] **Step 2: Verify the file was created and looks complete**

Run:
```bash
wc -l commands/tdd.md
head -5 commands/tdd.md
```
Expected: roughly 300+ lines; first line is `---` (frontmatter open).

- [ ] **Step 3: Do not commit yet** — bundled with Task 5.

---

## Task 4: Mirror `commands/tdd.md` and `commands/refactor.md` into `.claude/commands/`

**Files:**
- Create: `.claude/commands/tdd.md` (copy of `commands/tdd.md`)
- Modify: `.claude/commands/refactor.md` (copy of `commands/refactor.md`)

- [ ] **Step 1: Copy both files**

```bash
cp commands/tdd.md .claude/commands/tdd.md
cp commands/refactor.md .claude/commands/refactor.md
```

- [ ] **Step 2: Verify the copies match exactly**

```bash
diff commands/tdd.md .claude/commands/tdd.md
diff commands/refactor.md .claude/commands/refactor.md
```
Expected: no output from either diff (files identical).

- [ ] **Step 3: Do not commit yet** — bundled with Task 5.

---

## Task 5: Add `.tdd-context.json` to `.gitignore` and commit everything

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Inspect current `.gitignore`**

```bash
cat .gitignore
```

- [ ] **Step 2: Append `.tdd-context.json` if not already present**

Append this single line to `.gitignore` (only if not already there):

```
.tdd-context.json
```

- [ ] **Step 3: Stage every file changed in Tasks 1–5**

```bash
git add \
  docs/superpowers/specs/2026-05-17-tdd-skill-design.md \
  docs/superpowers/plans/2026-05-17-tdd-skill-design.md \
  commands/tdd.md \
  commands/refactor.md \
  .claude/commands/tdd.md \
  .claude/commands/refactor.md \
  .gitignore
```

- [ ] **Step 4: Commit**

The user has a hard rule: never commit without explicit user instruction. Stop here and ask:

*"All files staged. Ready to commit with message `feat: add /tdd skill and --output override for /refactor`? (yes / no / different message)"*

Only run `git commit` after the user confirms.

---

## Task 6: Verify end-to-end smoke (no execution)

This task verifies the artifacts are in place without actually invoking `/tdd` (which would require a real task and Claude session).

- [ ] **Step 1: Verify both command files exist in both locations**

```bash
ls -la commands/tdd.md .claude/commands/tdd.md commands/refactor.md .claude/commands/refactor.md
```
Expected: all four files exist and are non-empty.

- [ ] **Step 2: Verify the `--output` flag is documented in both refactor files**

```bash
grep -l -- "--output" commands/refactor.md .claude/commands/refactor.md
```
Expected: both file paths are printed.

- [ ] **Step 3: Verify the spec cross-link is in place**

```bash
grep "Plan:" docs/superpowers/specs/2026-05-17-tdd-skill-design.md
```
Expected: a line containing `[/tdd Skill Implementation Plan](../plans/2026-05-17-tdd-skill-design.md)`.

- [ ] **Step 4: Verify the plan cross-link is in place**

```bash
grep "Spec:" docs/superpowers/plans/2026-05-17-tdd-skill-design.md
```
Expected: a line containing `[TDD Skill — Design Spec](../specs/2026-05-17-tdd-skill-design.md)`.

- [ ] **Step 5: Inform the user**

Print: *"All artifacts in place. Run `bash install.sh` if you want to install to `~/.claude/`. To smoke-test, invoke `/tdd \"Some task\"` in a fresh Claude session."*

---

## Self-Review

**Spec coverage (against `docs/superpowers/specs/2026-05-17-tdd-skill-design.md`):**

| Spec section | Implemented by |
|---|---|
| Invocation (with/without argument, feature-invoked) | Task 3, "Invocation" section of tdd.md |
| Context passing (Option A + B hybrid) | Task 3, "On Start — Context Resolution" steps 2–4 |
| Log location derivation | Task 3, "On Start" Step 3 |
| Phase 1 — Opening Questions (3 questions, sequential) | Task 3, "Phase 1" section |
| Phase 2 — Plan Generation (structure, rules, review gate) | Task 3, "Phase 2" section |
| Phase 3 — Session Conduct (both modes, hard rules, React handling, Cleanup) | Task 3, "Phase 3" section |
| Phase 4 — Log Files (`tdd-plan.md`, `tdd-implementation.md`, refactor linking) | Task 3, "Phase 4" section |
| Rollback (Case A + Case B + state file schema) | Task 3, "Rollback Behavior" section |
| Refactor log location override | Task 2 (`--output <dir>` in `/refactor`) |
| `.tdd-context.json` schema (additional fields) | Task 3, "On Start" Step 4 |

**Placeholder scan:** No TBDs, no "implement later", no naked "Similar to Task N" without code. All steps either show the exact content to write or the exact command to run.

**Type / name consistency:**
- `<log folder>` is used consistently across Phases 1–4 and Rollback.
- `--output <dir>` flag name matches in `/tdd` invocation calls and `/refactor` documentation (Task 2 + Task 3).
- `.tdd-context.json` fields (`feature`, `sticky`, `storyMapPath`, `currentIncrement`, `currentPhase`, `filesChanged`) match the spec verbatim. `logFolder` is an addition this plan locks down (Implementation Decisions section).
- Commit message format `feat: <sticky-slug>: <behavior>` is consistent across Phase 2 (plan) and Phase 3 (cycle) sections.

**Gaps:** None against the spec. The "What This Spec Does Not Cover" section (hexagonal composition, multi-language runner detection, unrelated test failures) is correctly left out of scope for this implementation.

---

## Out of Scope (deferred to future plans)

- Context-window guard hook for `/tdd` (similar to `start-refactor-skill.sh`). Not in spec.
- Stop-hook integration for token counting on `/tdd` sessions. Not in spec.
- Cross-skill composition with `/hexagonal` (still unimplemented).
- Auto-invocation wiring from `/feature` to `/tdd` (`/feature` skill is unimplemented).
- Multi-language test runner detection. The skill asks the user if unsure.
