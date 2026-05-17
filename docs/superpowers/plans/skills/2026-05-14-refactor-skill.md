# Refactor Command Implementation Plan

> **Specs:** [Refactor Skill — Research Notes](../../specs/skills/refactor-skill/2026-05-14-research-refactor-skill.md) · [Naming Research](../../specs/skills/refactor-skill/2026-05-14-research-refactor-skill_naming.md)

**Goal:** Create a `/refactor` Claude Code custom command that proposes naming refactors using business domain language, following an inside-out strategy through the code structure.

**Architecture:** A native Claude Code command living in `commands/refactor.md` (canonical source) mirrored to `.claude/commands/refactor.md` (local copy). The command produces two session output files per run: a flat rename log and a claude-mermaid tree diagram.

**Tech Stack:** Markdown (refactor.md), Mermaid (tree diagram via claude-mermaid MCP), native Claude Code

---

## File Structure

| File | Purpose |
|------|---------|
| `commands/refactor.md` | Canonical source of truth for all command instructions |
| `.claude/commands/refactor.md` | Local copy — kept in sync with `commands/refactor.md` |
| `docs/refactorings/` | Output directory created by the command at session start (gitignored) |

---

## Task 1: Command Directory Structure ✅

**Files:**
- `commands/refactor.md` (create)
- `.claude/commands/refactor.md` (create)

- [x] **Step 1: Add `docs/refactorings/` to .gitignore**
- [x] **Step 2: Commit**

---

## Task 2: Command File — Invocation & Basic Session Setup ✅

- [x] **Step 1: Write the header and invocation section**
  - Frontmatter with `description` and `allowed-tools`
  - `@` reference required, halt if omitted
  - Recommended model note
  - `On Start` steps: print scope message, record timestamp, create output dir and log
  - Folder: scan and order files simplest-first, print order
  - Single file: proceed directly to processing
- [x] **Step 2: Mirror to `.claude/commands/refactor.md`**
- [x] **Step 3: Commit**

---

## Task 3: Command File — Processing Strategy ✅

- [x] **Step 1: Append processing strategy section**
  - Display `[File: <relative-path>]` header on every message
  - Inside-out order: constants → conditionals (silent) → function rename
  - Rank functions by size (smallest first)
- [x] **Step 2: Mirror**
- [x] **Step 3: Commit**

---

## Task 4: Command File — Proposal Format & Accept/Reject Flow ✅

- [x] **Step 1: Append proposal format and accept/reject flow**
  - Format: old name → new name + Why
  - yes → apply + log; no → one alternative; no again → skip + log rejected
- [x] **Step 2: Mirror**
- [x] **Step 3: Commit**

---

## Task 5: Command File — Session Log Format ✅

Original scope (flat rename log with Constants/Functions/Tests). Superseded by Task 9.

- [x] **Step 1: Append session log section**
- [x] **Step 2: Mirror**
- [x] **Step 3: Commit**

---

## Task 6: Command File — Tree Diagram Generation ✅

Original scope (basic Mermaid tree). Superseded by Task 11.

- [x] **Step 1: Append tree diagram section**
- [x] **Step 2: Mirror**
- [x] **Step 3: Commit**

---

## Task 7: Smoke Test

- [ ] **Step 1: Point `/refactor` at a real file in any existing project**
- [ ] **Step 2: Verify the command announces naming-only scope**
- [ ] **Step 3: Verify it displays the file header on every message**
- [ ] **Step 4: Verify the inside-out order** (constants before function rename)
- [ ] **Step 5: Verify reject → retry → skip flow**
- [ ] **Step 6: Verify session log is written correctly**
- [ ] **Step 7: Verify tree diagram is generated at session end**

---

## Task 8: Scoped Output Path Naming ✅

**Behavior added beyond original spec.**

Output files are now scoped by folder and stem instead of a flat `docs/refactorings/` root.

- [x] **Single file** (`src/utils/prompt.ts`):
  - `<folder>` = immediate parent dir name (`utils`)
  - `<stem>` = filename without extension (`prompt`)
  - Output dir: `docs/refactorings/<folder>/`
  - Log: `refactor-names-<folder>-<stem>-<timestamp>.md`
  - Tree: `refactor-names-<folder>-<stem>-<timestamp>-tree.mmd`
- [x] **Folder** (`src/utils/`):
  - `<folder>` = target folder name (`utils`)
  - Output dir: `docs/refactorings/<folder>/`
  - Log: `refactor-names-<folder>-<timestamp>.md`
  - Tree: `refactor-names-<folder>-<timestamp>-tree.mmd`
- [x] **Mirror**
- [x] **Commit**

---

## Task 9: Experiment Block in Session Log ✅

**Behavior added beyond original spec.**

Session log now opens with a scientific-method experiment block written in two passes.

- [x] **Log initialized with these sections (written at session start)**:
  ```
  ## Session Info
  Date: <timestamp>
  Models: <primary model + any sub-agents>
  Total Tokens: —
  ```
  followed by: `## Hypothesis`, `## Prediction`, `## Verdict`, `## Analysis`, `## Learnings`, `## Next Hypothesis`
- [x] **Hypothesis and Prediction** written at session start (after user confirms them — see Task 10)
- [x] **Verdict, Analysis, Learnings, Next Hypothesis** written at session end after user approves analysis (see Task 12)
- [x] **Mirror**
- [x] **Commit**

---

## Task 10: Hypothesis & Prediction Prompts at Session Start ✅

**Behavior added beyond original spec.**

Before processing begins, the command asks the user two questions in sequence (one at a time) with pre-filled defaults.

- [x] **Hypothesis prompt** with default:
  > "I suspect not all the names in here are domain driven and some are not written in prose and are instead written based on technology or implementation based terms."
- [x] **Prediction prompt** with default:
  > "I expect to find a mix — some names will be fine, others will reference technology concepts (String, Array, Handler, Manager, Utils) or describe what the code does mechanically rather than what it means in the business. I don't expect it to be uniformly bad."
- [x] Accepting Enter / "default" / "yes" / "ok" uses the default verbatim
- [x] Both responses written immediately to `## Hypothesis` and `## Prediction` in the session log
- [x] **Mirror**
- [x] **Commit**

---

## Task 11: Stop Hook — Total Tokens Auto-Fill ✅

**Behavior added beyond original spec.**

The session log path is written to `~/.claude/refactor-session.tmp` so a Stop hook can fill in the `Total Tokens` field automatically at session end.

- [x] After creating the log file, write its absolute path:
  ```bash
  echo "/absolute/path/to/log.md" > ~/.claude/refactor-session.tmp
  ```
- [x] **Mirror**
- [x] **Commit**

---

## Task 12: At Session End — Analysis (approve/reject flow) ✅

**Behavior added beyond original spec.**

Before generating the tree diagram, the command produces an experiment analysis and asks the user to approve or reject it.

- [x] **Four sections produced**: Analysis, Verdict (`confirmed` / `refuted` / `partial`), Learnings, Next Hypothesis
- [x] **Approve** → write to the session log as-is
- [x] **Reject** → prompt user to type their own analysis, record it instead
- [x] **Mirror**
- [x] **Commit**

---

## Task 13: Naming Principles as Standalone Section ✅

**Behavior added beyond original spec.**

Naming principles moved out of the Proposal Format section into their own `## Naming Principles` section with richer descriptions and examples.

- [x] Apply in order: behavior not implementation → business domain → read conditionals → prose test → no type suffixes
- [x] **Mirror**
- [x] **Commit**

---

## Task 14: Detailed Mermaid Tree Diagram ✅

**Behavior added beyond original spec.** Replaces the basic tree from Task 6.

- [x] **Diagram structure**: `%%{init}%%` config + `graph TD`, file → function → rename nodes
- [x] **Node styling table**:
  | Node type | Fill | Stroke | Extra |
  |-----------|------|--------|-------|
  | File | `#e8f0fe` | `#4a6cf7` | `font-weight:bold` |
  | Function | `#fff8e1` | `#f0a500` | `font-weight:bold` |
  | Accepted rename | `#d4edda` | `#28a745` | — |
  | Rejected rename | `#f8d7da` | `#dc3545` | — |
- [x] `useMaxWidth: false, wrappingWidth: 1200` to prevent text wrapping
- [x] Accepted = `✓`, rejected = `✗` at end of node label
- [x] Multiple files each get their own root node
- [x] **Mirror**
- [x] **Commit**

---

## Task 15: Error Handling ✅

**Behavior added beyond original spec.**

- [x] **`@` reference not found** → halt, print path not found message
- [x] **File has no functions** → tell user, skip, continue to next file
- [x] **`docs/refactorings/` can't be created** → halt and explain, do not proceed
- [x] **Mermaid MCP unavailable** → write `.mmd` source to disk anyway, note it needs manual rendering
- [x] **Mirror**
- [x] **Commit**
