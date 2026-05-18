---
description: Use when user runs /tdd, says "TDD this task", asks to drive a RED/GREEN/REFACTOR cycle, or is auto-invoked by /feature on a code-related sticky.
allowed-tools: "Read Edit Write Bash"
---

# <span style="color:#76a039">TDD Skill</span>

A session conductor for test-driven development on a single task or sticky. Drives opening questions → plan generation → RED/GREEN/REFACTOR cycles → final cleanup. Writes a `tdd-plan.md` before any code and appends to `tdd-implementation.md` after every cycle. Auto-invokes `/refactor` during the REFACTOR phase.

> **Recommended model:** `claude-opus-4-7` — TDD requires judgment about test boundaries, increment ordering, and refactor candidates. Opus handles this better than Sonnet.
> To switch: `/model claude-opus-4-7`

---

## <span style="color:#76a039">Invocation</span>

```
/tdd "Proceed to checkout"   # explicit task/sticky name
/tdd                         # skill asks for task name if omitted
(feature skill auto-invokes) # trigger: any code-related sticky in Phase 4 of /feature
```

---

## <span style="color:#76a039">On Start — Context Resolution and Rollback Check</span>

Execute these checks in order, before asking any opening questions.

### <span style="color:#76a039">Step 1 — Check for prior interrupted session</span>

If `.tdd-context.json` exists in the project root, a previous TDD session was interrupted. Perform **Rollback Case B** (see Rollback Behavior below) before doing anything else. Then continue to Step 2.

### <span style="color:#76a039">Step 2 — Resolve task name and feature context</span>

Two sources, combined:

- **Argument (primary truth):** the sticky/task name passed after `/tdd`. If absent, ask the user: *"What task are we TDD-ing? Give me a short name."* Use the user's answer as the task name.
- **State file (supplementary):** if the feature skill wrote `.tdd-context.json` before invoking, read `feature` and `storyMapPath` from it.

**Disagreement handling:**
- If both the argument and the state file's `sticky` field are present and they disagree, halt. Show both values and ask: *"The argument says '<arg>' but the state file says '<state-sticky>'. Which is correct?"* Use the user's choice and update the state file to match.
- If only the argument is present (no state file), proceed as standalone — no feature context.

### <span style="color:#76a039">Step 3 — Derive the log folder</span>

| Source                               | Log folder |
|--------------------------------------|------------|
| Feature-invoked (state file present) | `story-maps/<feature>/tdd/<sticky-slug>/` |
| Standalone (no state file) | `tdd/<task-slug>/` (relative to project root) |

`<sticky-slug>` and `<task-slug>` are kebab-case versions of the task name (lowercase, spaces → `-`, strip punctuation).

Create the folder if it doesn't exist.

### <span style="color:#76a039">Step 4 — Write or update `.tdd-context.json`</span>

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

## <span style="color:#76a039">Phase 1 — Opening Questions</span>

Three questions, asked in sequence. Wait for each answer before asking the next.

### <span style="color:#76a039">Question 1 — Opt-in</span>

```
Work on "<task name>" — do you want this TDD'd?
(yes / no)
```

- **no** → delete `.tdd-context.json`, print *"Skipping TDD. Continue however you'd like."*, exit cleanly. No log files written.
- **yes** → proceed to Question 2.

### <span style="color:#76a039">Question 2 — Direction</span>

If `.tdd-context.json` is present (feature-invoked), skip this question and print:

```
Direction: outside-in, starting at the React Hook layer (view layer is scaffold-only, not TDD'd).
```

Otherwise, show the default and offer an override:

```
Direction: outside-in at the React Hook layer (default).
  — Views are scaffold-only; TDD begins at the hook layer and works down.
  — Type inside-out to override, or press enter to accept.
```

- If the user accepts (or types nothing): use **outside-in**, hook layer entry point.
- If the user types **inside-out**: use inside-out, lowest layer first.

Record the answer. Drives increment ordering in the plan.

### <span style="color:#76a039">Question 3 — Plan review</span>

```
Want to review the TDD plan before I start implementing?
(yes / no)
```

- **yes** → human-in-the-loop mode for the rest of the session.
- **no** → conductor mode for the rest of the session.

The plan itself is always generated and written to `tdd-plan.md` regardless of the answer. The question only controls whether the plan (and subsequent phase transitions) are gated by user approval.

---

## <span style="color:#76a039">Phase 2 — Plan Generation</span>

Generated from the answers to Phase 1 before any code is written.

### <span style="color:#76a039">Plan file location</span>

`<log folder>/tdd-plan.md`

### <span style="color:#76a039">Plan structure</span>

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

### <span style="color:#76a039">Rules baked into plan generation</span>

- **Outside-in (React):** Increment 1 is the component scaffold — non-TDD, no RED phase. TDD entry point is the hook layer (Increment 2). Increments ordered hook → lower layers. Never view-first, never domain-first.
- **Outside-in (non-React):** increments ordered highest layer (controller/API) → lowest. Never domain-first.
- **Inside-out:** increments ordered lowest layer → highest.
- **No tests at the controller layer** (React or non-React).
- **Test names:** prose and domain language only. No function names, no technical patterns, no "should", no framework terms (e.g. `describe`, `it`).
- **One behavior per increment:** an "and" in a test name means split the increment.
- **Always write the plan**, even if the user chose not to review it.

### <span style="color:#76a039">Plan review gate</span>

- **Conductor mode:** plan is written silently. Skill proceeds straight to Phase 3.
- **Human-in-the-loop:** plan is shown in full and the user is asked:
  ```
  Plan approved? (yes / revise / cancel)
  ```
  - **yes** → proceed to Phase 3.
  - **revise** → ask what to change, regenerate the plan, re-present.
  - **cancel** → delete `.tdd-context.json`, exit cleanly. Plan file is kept on disk.

---

## <span style="color:#76a039">Phase 3 — Session Conduct</span>

Drive every increment in sequence using the plan as the guide. Update `.tdd-context.json` (`currentIncrement`, `currentPhase`, `filesChanged`) after each transition.

### <span style="color:#76a039">Mode comparison</span>

| Mode               | Plan review    | Commit prompts | Phase gates |
|--------------------|----------------|----------------|-------------|
| Conductor mode | Silent | Auto-commit | None |
| Human-in-the-loop | Show + approve | Ask each time | RED, GREEN, REFACTOR |

### <span style="color:#76a039">Conductor mode — fully autonomous</span>

```
RED      → write one failing test → run suite → confirm fails for right reason → auto-proceed
GREEN    → write minimal code → run suite → confirm all pass → auto-commit
REFACTOR → invoke /refactor with --output <log folder> → re-run suite → confirm still green → auto-commit
LOG      → append cycle entry to tdd-implementation.md → next increment
```

No prompts. No gates. Commits fire automatically.

### <span style="color:#76a039">Human-in-the-loop mode</span>

```
RED      → write one failing test → run suite → show failing output → "Proceed to GREEN?"
GREEN    → write minimal code → run suite → show passing output → "Commit? feat: <slug>: <behavior>"
REFACTOR → invoke /refactor with --output <log folder> → re-run suite →
           "Commit refactor? feat: <slug>: refactor: <behavior>"
           (user can answer "skip" to skip the refactor commit and move to next increment)
LOG      → append cycle entry to tdd-implementation.md → next increment
```

If the user answers "stop" or "cancel" at any prompt, perform **Rollback Case A**.

### <span style="color:#76a039">Hard rules — enforced in both modes</span>

- RED must be verified as failing before GREEN starts — never skipped.
- A test failure must be for the *right reason* (missing feature, not a typo or import error). If wrong-reason failure, fix the test and rerun before declaring RED.
- GREEN writes only enough to pass the current test — no extra behavior.
- REFACTOR only happens while tests are green. If `/refactor` breaks tests, fix before committing.
- One test per RED phase — an "and" in a test name means split the increment.

### <span style="color:#76a039">React-specific handling</span>

- Increment 1 (component scaffold): no RED phase. Write the view layer directly — this is not TDD'd.
- TDD entry point is Increment 2: the hook layer. This is "outside-in" for React — starting under the skin, not at the view.
- Work down from the hook layer through subsequent increments.
- No tests at the controller layer.

### <span style="color:#76a039">Cleanup & Verification (final increment)</span>

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

## <span style="color:#76a039">Phase 4 — Log Files</span>

Two files, both inside the log folder. Existence of both is enforced by the `verify-tdd-logs` hook — the next prompt will be blocked if either file is missing once a TDD session is active. Write them at the moments described below; do not wait.

### <span style="color:#76a039">`tdd-plan.md`</span>

Written once at the end of Phase 2, before any code. Never modified after. Full structure shown in Phase 2.

### <span style="color:#76a039">`tdd-implementation.md`</span>

Initialized at the start of Phase 3 with a header (before increment 1 begins). Appended to after each cycle completes.

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

### <span style="color:#76a039">Refactor log linking</span>

The refactor log written by `/refactor` lands inside the log folder (because `/tdd` passes `--output <log folder>`). Link to it by **relative path** in the implementation log — do not duplicate content.

---

## <span style="color:#76a039">Rollback Behavior</span>

Two cases.

| Case            | Trigger |
|-----------------|---------|
| A — intentional | User says "stop" or "cancel" at any gate prompt during Phase 3 |
| B — unexpected | `.tdd-context.json` is present at session start (previous session ended mid-increment) |

### <span style="color:#76a039">Case A — Intentional exit</span>

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

### <span style="color:#76a039">Case B — Unexpected termination (detected on next startup)</span>

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

### <span style="color:#76a039">What gets rolled back vs kept</span>

| Artifact                                   | Action |
|--------------------------------------------|--------|
| Uncommitted test files (mid-RED) | Rolled back |
| Uncommitted production code (mid-GREEN) | Rolled back |
| Uncommitted refactor changes (mid-REFACTOR) | Rolled back |
| Already-committed GREEN commits | Kept — clean commits, untouched |
| `tdd-plan.md` | Kept — pre-implementation artifact, always clean |
| `tdd-implementation.md` partial entries | ABANDONED entry appended, file kept |

---

## <span style="color:#76a039">Error Handling</span>

- **No argument and user supplies no name** → halt with: *"I need a task name to proceed. Try `/tdd \"Your task name\"`."*
- **Disagreement between argument and state file** → halt and ask which is correct (see On Start, Step 2).
- **Log folder cannot be created** → halt with the underlying error. Do not proceed without a log destination.
- **Test runner not detected (no `package.json` test script, no `pytest`, no `go test` config)** → ask the user: *"How do I run the tests for this project?"* Use the user's command verbatim for all suite runs in this session.
- **`/refactor` invocation fails** → leave the REFACTOR phase incomplete, surface the error, skip to next increment (do not commit). User can re-invoke `/refactor` manually after the session.

---

## <span style="color:#76a039">Composition with Other Skills</span>

- `/refactor` is invoked during the REFACTOR phase with `--output <log folder>` so refactor artifacts land alongside the implementation log.
- `/feature` (future skill) auto-invokes `/tdd` per code-related sticky and writes `.tdd-context.json` immediately before doing so.
- Standalone invocation (no state file) is fully supported — the skill prompts for the task name and uses the standalone log folder layout.
