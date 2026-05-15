---
name: refactor
description: Use when the user runs /refactor and provides a file or folder reference to rename identifiers using business domain language and behavioral prose.
---

# Refactor Skill

This skill handles **naming refactors only**. More refactoring types will be added in future iterations.

## Invocation

```
/refactor @<file-or-folder>
```

The `@` reference is required. If omitted, stop and ask for one before doing anything else.

---

## On Start

1. Print: *"This skill currently handles naming refactors only. More refactoring types will be added in future iterations."*

2. Record the session timestamp (format: `YYYY-MM-DDThh-mm-ss`).

3. Create the output directory if it doesn't exist: `docs/refactorings/`

4. Create the flat log: `docs/refactorings/refactor-names-<timestamp>.md`
   Initialize with:
   ```
   ## Constants

   ## Functions

   ## Tests
   ```

5. If a **folder** was given:
   - Scan all files, order by complexity simplest first (fewest functions, smallest LOC).
   - Print: *"Processing files in this order:"* followed by the ordered list.

6. If a **single file** was given, proceed directly to Processing.

---

## Processing Each File

Always display `[File: <relative-path>]` at the top of every message while processing.

For each file, repeat this sequence:

1. Find all functions. Rank by size (line count), smallest first.
2. For the current function (starting with smallest):
   - **a. Constants first** — identify every constant defined inside the function. Propose a rename for each one before moving on.
   - **b. Read conditionals** — if the function contains `if`/`else`, `switch`, or ternary expressions, silently note what behavior each branch guards. Do not surface this to the user — use it as context for naming.
   - **c. Rename the function** — using what you learned from the constants and conditionals, propose a rename for the function itself.
3. Move to the next function (next smallest) and repeat.
4. When all functions in the file are done, move to the next file.

---

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

---

## Naming Principles

Apply in order:

1. **Describe behavior, not implementation.** `buildSystemPromptString` → `buildSystemPrompt`. "String" is the type, not the behavior.
2. **Use the business domain.** If the function formats Etsy listing data, prefer `formatListingOutput` over `formatData`.
3. **Read conditionals for clues.** If a function checks `if (user.isAdmin)`, the function probably guards admin access — name it accordingly.
4. **Well-written prose.** The name should complete *"this code..."* — `buildSystemPrompt` → *"this code builds the system prompt."* ✓ / `doPromptStuff` → *"this code does prompt stuff."* ✗
5. **No type suffixes.** Never include the type in the name: no `String`, `Array`, `List`, `Object`, `Bool`, `Int`.

---

## Session Log

After each proposal resolves, append to `docs/refactorings/refactor-names-<timestamp>.md` under the appropriate section.

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
- No file or folder info — names only.
- If a section has no entries, write `(none this session)` under it.

---

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

| Node type | Fill | Stroke | Extra |
|-----------|------|--------|-------|
| File | `#e8f0fe` | `#4a6cf7` | `font-weight:bold` |
| Function | `#fff8e1` | `#f0a500` | `font-weight:bold` |
| Accepted rename | `#d4edda` | `#28a745` | — |
| Rejected rename | `#f8d7da` | `#dc3545` | — |

### Rules

- Always use `%%{init: {"flowchart": {"useMaxWidth": false, "wrappingWidth": 1200}}}%%` so node text does not wrap.
- Every proposed rename (accepted or rejected) appears in the tree.
- Mark accepted with `✓` and rejected with `✗` at end of node label.
- If multiple files were processed, each file gets its own root node.
