# Refactor Command Implementation Plan

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

## Task 1: Command Directory Structure

**Files:**
- `commands/refactor.md` (create)
- `.claude/commands/refactor.md` (create)

- [ ] **Step 1: Add `docs/refactorings/` to .gitignore**

Add to `.gitignore`:
```
docs/refactorings/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore refactor session output"
```

---

## Task 2: Command File — Invocation & Session Setup

**Files:**
- Create: `commands/refactor.md`
- Mirror to: `.claude/commands/refactor.md`

- [ ] **Step 1: Write the header and invocation section**

```markdown
---
description: Use when user runs /refactor, asks to rename identifiers, variables, or functions, or says "clean up naming" on a file or folder.
allowed-tools: "Read Edit Bash"
---

# Refactor Skill

This skill handles **naming refactors only**. More refactoring types will be added in future iterations.

## Invocation

```
/refactor @<file-or-folder>
```

The `@` reference is required. If omitted, stop and ask for one before doing anything else.

> **Recommended model:** `claude-sonnet-4-6` — fast and accurate for mechanical naming refactors. Opus is unnecessary here.
> To switch: `/model claude-sonnet-4-6`

## On Start

1. Print: *"This skill currently handles naming refactors only. More refactoring types will be added in future iterations."*

2. Record the session timestamp (format: `YYYY-MM-DDThh-mm-ss`).

3. Create the output directory if it doesn't exist: `docs/refactorings/`

4. Create the flat log file: `docs/refactorings/refactor-names-<timestamp>.md`

5. If a **folder** was given:
   - Scan all files, order by complexity simplest first (fewest functions, smallest LOC).
   - Print: *"Processing files in this order:"* followed by the ordered list.

6. If a **single file** was given, proceed directly to Processing.
```

- [ ] **Step 2: Mirror to `.claude/commands/refactor.md`**

- [ ] **Step 3: Commit**

```bash
git add commands/refactor.md .claude/commands/refactor.md
git commit -m "feat: add refactor command invocation and session setup"
```

---

## Task 3: Command File — Processing Strategy

**Files:**
- Modify: `commands/refactor.md`
- Mirror to: `.claude/commands/refactor.md`

- [ ] **Step 1: Append the processing strategy section**

```markdown
## Processing Each File

Always display `[File: <relative-path>]` at the top of every message while processing.

For each file, repeat this sequence:

1. Find all functions in the file. Rank by size (line count), smallest first.
2. For the current function (starting with the smallest):
   - **a. Constants first:** Identify every constant defined inside the function. Propose a rename for each one before moving on.
   - **b. Read conditionals:** If the function contains `if`/`else`, `switch`, or ternary expressions, silently note what behavior each branch guards. Do not surface this to the user — use it as context for naming.
   - **c. Rename the function:** Using what you learned from the constants and conditionals, propose a rename for the function itself.
3. Move to the next function (next smallest) and repeat.
4. When all functions in the file are done, move to the next file.
```

- [ ] **Step 2: Mirror to `.claude/commands/refactor.md`**

- [ ] **Step 3: Commit**

```bash
git add commands/refactor.md .claude/commands/refactor.md
git commit -m "feat: add refactor command inside-out processing strategy"
```

---

## Task 4: Command File — Proposal Format & Accept/Reject Flow

**Files:**
- Modify: `commands/refactor.md`
- Mirror to: `.claude/commands/refactor.md`

- [ ] **Step 1: Append the proposal format section**

```markdown
## Proposal Format

Present each rename as:

```
[File: src/utils/prompt.ts]

const buildSystemPromptString  →  buildSystemPrompt
Why: The name includes the type ("String") which is an implementation detail, not
     behavior. The name already implies it builds something; the return type is
     evident from context.

Accept? (yes / no)
```

### Accept / Reject Flow

- **yes** → apply the rename in the file, append to session log, move to next candidate.
- **no** → generate one alternative suggestion with a different name and explanation. Present in same format. Ask again.
- **no again** → skip silently. Log as rejected. Move on.

### Naming Principles

1. **Describe behavior, not implementation.** `buildSystemPromptString` → `buildSystemPrompt`.
2. **Use the business domain.** Prefer `formatListingOutput` over `formatData`.
3. **Read conditionals for clues.** If a function checks `if (user.isAdmin)`, name it accordingly.
4. **Well-written prose.** The name should complete *"this code..."*.
5. **No type suffixes.** Never include the type in the name: no `String`, `Array`, `List`, `Object`, `Bool`, `Int`.
```

- [ ] **Step 2: Mirror to `.claude/commands/refactor.md`**

- [ ] **Step 3: Commit**

```bash
git add commands/refactor.md .claude/commands/refactor.md
git commit -m "feat: add refactor command proposal format and naming principles"
```

---

## Task 5: Command File — Session Log Format

**Files:**
- Modify: `commands/refactor.md`
- Mirror to: `.claude/commands/refactor.md`

- [ ] **Step 1: Append the session log section**

```markdown
## Session Log

After each proposal resolves, append to `docs/refactorings/refactor-names-<timestamp>.md`.

Rules:
- Group by construct type: `## Constants`, `## Functions`, `## Tests`.
- Include both accepted and rejected proposals.
- No file or folder info — names only.
- If a section has no entries, write `(none this session)` under it.
```

- [ ] **Step 2: Mirror to `.claude/commands/refactor.md`**

- [ ] **Step 3: Commit**

```bash
git add commands/refactor.md .claude/commands/refactor.md
git commit -m "feat: add refactor command session log format"
```

---

## Task 6: Command File — Tree Diagram Generation

**Files:**
- Modify: `commands/refactor.md`
- Mirror to: `.claude/commands/refactor.md`

- [ ] **Step 1: Append the tree diagram section**

```markdown
## At Session End — Tree Diagram

Generate a Mermaid tree diagram using the claude-mermaid MCP tool and save to:

```
docs/refactorings/refactor-names-<timestamp>-tree.mmd
```

The tree mirrors the **code structure** — file → function → renames inside it.
```

- [ ] **Step 2: Mirror to `.claude/commands/refactor.md`**

- [ ] **Step 3: Commit**

```bash
git add commands/refactor.md .claude/commands/refactor.md
git commit -m "feat: add refactor command tree diagram generation"
```

---

## Task 7: Smoke Test

- [ ] **Step 1: Point `/refactor` at a real file in any existing project**

- [ ] **Step 2: Verify the command announces naming-only scope**

- [ ] **Step 3: Verify it displays the file header on every message**

- [ ] **Step 4: Verify the inside-out order** (constants before function rename)

- [ ] **Step 5: Verify reject → retry → skip flow**

- [ ] **Step 6: Verify session log is written correctly**

- [ ] **Step 7: Verify tree diagram is generated at session end**
