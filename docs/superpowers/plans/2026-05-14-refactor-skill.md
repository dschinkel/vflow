# Refactor Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `/refactor` Claude Code custom skill that proposes naming refactors using business domain language, following an inside-out strategy through the code structure.

**Architecture:** A Superpowers-compatible skill living in `.claude/skills/refactor/` with a `SKILL.md` that drives the agent's behavior and a `.skillfish.json` manifest. The skill produces two session output files per run: a flat rename log and a claude-mermaid tree diagram.

**Tech Stack:** Markdown (SKILL.md), JSON (.skillfish.json), Mermaid (tree diagram via claude-mermaid MCP), Claude Code Superpowers plugin

---

## File Structure

| File | Purpose |
|------|---------|
| `.claude/skills/refactor/SKILL.md` | All skill instructions — invocation, processing strategy, proposal format, log format, diagram generation |
| `.claude/skills/refactor/.skillfish.json` | Skill manifest: name, description, trigger command |
| `docs/refactorings/` | Output directory created by the skill at session start (not committed — add to .gitignore) |

---

## Task 1: Skill Directory Structure

**Files:**
- Create: `.claude/skills/refactor/` (directory)

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p /path/to/repo/.claude/skills/refactor
```

- [ ] **Step 2: Add `docs/refactorings/` to .gitignore**

Add to `.gitignore`:
```
docs/refactorings/
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: scaffold refactor skill directory and ignore session output"
```

---

## Task 2: Skill Manifest

**Files:**
- Create: `.claude/skills/refactor/.skillfish.json`

- [ ] **Step 1: Write the manifest**

```json
{
  "name": "refactor",
  "description": "Proposes naming refactors using business domain language, following an inside-out strategy. Naming only — more refactoring types will be added iteratively.",
  "command": "refactor",
  "version": "0.1.0",
  "type": "interactive"
}
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/refactor/.skillfish.json
git commit -m "feat: add refactor skill manifest"
```

---

## Task 3: SKILL.md — Invocation & Session Setup

**Files:**
- Create: `.claude/skills/refactor/SKILL.md`

This task writes the first section of SKILL.md only. Subsequent tasks append the remaining sections.

- [ ] **Step 1: Write the header and invocation section**

```markdown
# Refactor Skill

This skill handles **naming refactors only**. More refactoring types will be added in future iterations.

## Invocation

```
/refactor @<file-or-folder>
```

The `@` reference is required. If omitted, stop and ask for one before doing anything else.

## On Start

1. Print: *"This skill currently handles naming refactors only. More refactoring types will be added in future iterations."*

2. Record the session timestamp (format: `YYYY-MM-DDThh-mm-ss`).

3. Create the output directory if it doesn't exist: `docs/refactorings/`

4. Create the flat log file: `docs/refactorings/refactor-names-<timestamp>.md`
   Initialize it with:

   ```
   ## Constants

   ## Functions

   ## Tests
   ```

5. If a **folder** was given:
   - Scan all files in the folder.
   - Order them by complexity, simplest first (fewest functions, smallest LOC).
   - Print: *"Processing files in this order:"* followed by the ordered list.
   
6. If a **single file** was given, proceed directly to Processing.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/refactor/SKILL.md
git commit -m "feat: add refactor skill invocation and session setup"
```

---

## Task 4: SKILL.md — Processing Strategy

**Files:**
- Modify: `.claude/skills/refactor/SKILL.md`

- [ ] **Step 1: Append the processing strategy section**

```markdown
## Processing Each File

Always display `[File: <relative-path>]` at the top of every message while processing.

For each file, repeat this sequence:

1. Find all functions in the file. Rank by size (line count), smallest first.
2. For the current function (starting with the smallest):
   - **a. Constants first:** Identify every constant defined inside the function. Propose a rename for each one before moving on (see Proposal Format).
   - **b. Read conditionals:** If the function contains `if`/`else`, `switch`, or ternary expressions, silently note what behavior each branch guards. Do not surface this to the user — use it as context for naming.
   - **c. Rename the function:** Using what you learned from the constants and conditionals, propose a rename for the function itself.
3. Move to the next function (next smallest) and repeat.
4. When all functions in the file are done, move to the next file.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/refactor/SKILL.md
git commit -m "feat: add refactor skill inside-out processing strategy"
```

---

## Task 5: SKILL.md — Proposal Format & Accept/Reject Flow

**Files:**
- Modify: `.claude/skills/refactor/SKILL.md`

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

- If **yes**: apply the rename in the file, append to the session log (see Session Log), move to the next candidate.
- If **no**: generate one alternative suggestion with a different name and explanation. Present it in the same format. Ask again.
- If **no** again: skip this candidate silently. Do not log it as accepted. Do log it as rejected (see Session Log). Move on.

### Naming Principles

When generating a name, apply these in order:

1. **Describe behavior, not implementation.** `buildSystemPromptString` → `buildSystemPrompt`. The word "String" is the type, not the behavior.
2. **Use the business domain.** If the function formats Etsy listing data, prefer `formatListingOutput` over `formatData`.
3. **Read conditionals for clues.** If a function checks `if (user.isAdmin)`, the function probably guards admin access — name it accordingly.
4. **Well-written prose.** The name should read like a sentence fragment that completes *"this code..."*. `buildSystemPrompt` → *"this code builds the system prompt."* ✓. `doPromptStuff` → *"this code does prompt stuff."* ✗.
5. **No type suffixes.** Never include the type in the name: no `String`, `Array`, `List`, `Object`, `Bool`, `Int`.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/refactor/SKILL.md
git commit -m "feat: add refactor skill proposal format and naming principles"
```

---

## Task 6: SKILL.md — Session Log Format

**Files:**
- Modify: `.claude/skills/refactor/SKILL.md`

- [ ] **Step 1: Append the session log section**

```markdown
## Session Log

After each proposal resolves (accepted or final rejection), append to `docs/refactorings/refactor-names-<timestamp>.md` under the appropriate section header.

Format:

```
## Constants
buildSystemPromptString -> buildSystemPrompt [accepted]
resultStr -> formattedOutput [rejected]

## Functions
ExamplesList -> ColorSwatchList [accepted]
isDataValid -> hasRequiredFields [rejected]

## Tests
(none this session)
```

Rules:
- Group by construct type: `## Constants`, `## Functions`, `## Tests`.
- Include both accepted and rejected proposals.
- No file or folder info in this log — names only.
- If a section has no entries, write `(none this session)` under it.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/refactor/SKILL.md
git commit -m "feat: add refactor skill session log format"
```

---

## Task 7: SKILL.md — Tree Diagram Generation

**Files:**
- Modify: `.claude/skills/refactor/SKILL.md`

- [ ] **Step 1: Append the tree diagram section**

```markdown
## At Session End — Tree Diagram

When all files have been processed, generate a Mermaid tree diagram using the claude-mermaid MCP tool and save it to:

```
docs/refactorings/refactor-names-<timestamp>-tree.mmd
```

The tree mirrors the **code structure** — not the construct-type grouping in the flat log. It shows which file was processed, which functions were entered, and what was renamed inside each function.

### Diagram Structure

```
%%{init: {"flowchart": {"useMaxWidth": false, "wrappingWidth": 1200}}}%%
graph TD
  FILE["<relative-file-path>"]
  FILE --> FN["<functionName>()"]
  FN --> RENAME1["const <oldName> → <newName> ✓"]
  FN --> RENAME2["fn <oldName> → <newName> ✗"]
```

### Node Styling

| Node type | Fill | Stroke |
|-----------|------|--------|
| File | `#e8f0fe` | `#4a6cf7` |
| Function | `#fff8e1` | `#f0a500` |
| Accepted rename | `#d4edda` | `#28a745` |
| Rejected rename | `#f8d7da` | `#dc3545` |

Apply `font-weight:bold` to file and function nodes.

### Key Rules

- Use `%%{init: {"flowchart": {"useMaxWidth": false, "wrappingWidth": 1200}}}%%` at the top so node text does not wrap.
- Every rename that was proposed (accepted or rejected) appears in the tree.
- Mark accepted with `✓` and rejected with `✗` at the end of the node label.
- If multiple files were processed, each file gets its own root node at the top level of the graph.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/refactor/SKILL.md
git commit -m "feat: add refactor skill tree diagram generation"
```

---

## Task 8: Smoke Test

- [ ] **Step 1: Point `/refactor` at a real file in any existing project**

Pick a small file from a project you have locally. Run:
```
/refactor @<path-to-file>
```

- [ ] **Step 2: Verify the skill announces naming-only scope**

Expected first line: *"This skill currently handles naming refactors only..."*

- [ ] **Step 3: Verify it displays the file header on every message**

Every message from the skill should open with `[File: <path>]`.

- [ ] **Step 4: Verify the inside-out order**

Confirm it proposes constant renames before the function rename in the same function.

- [ ] **Step 5: Verify reject → retry → skip flow**

Reject a proposal twice. Confirm the skill skips it without prompting further.

- [ ] **Step 6: Verify session log is written correctly**

Check `docs/refactorings/refactor-names-<timestamp>.md` exists, is grouped by construct, and includes both accepted and rejected entries.

- [ ] **Step 7: Verify tree diagram is generated at session end**

Check `docs/refactorings/refactor-names-<timestamp>-tree.mmd` exists and mirrors the code structure (file → function → renames inside it).
