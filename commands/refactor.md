---
description: Use when user runs /refactor, asks to rename identifiers, variables, or functions, or says "clean up naming" on a file or folder.
allowed-tools: "Read Edit Bash"
---

# <span style="color:#76a039">Refactor Skill</span>

This skill handles **naming refactors only**. More refactoring types will be added in future iterations.

## <span style="color:#76a039">Invocation</span>

```
/refactor @<file-or-folder> [--output <dir>]
```

The `@` reference is required. If omitted, stop and ask for one before doing anything else.

The optional `--output <dir>` flag overrides the default output directory. When present, all session artifacts (the flat log and the tree diagram) are written directly inside `<dir>` using the same filenames described below. When absent, the default `docs/refactorings/<folder>/` layout is used unchanged. This flag exists so other skills (e.g. `/tdd`) can redirect refactor logs into their own feature folder.

> **Recommended model:** `claude-sonnet-4-6` — fast and accurate for mechanical naming refactors. Opus is unnecessary here.
> To switch: `/model claude-sonnet-4-6`

---

## <span style="color:#76a039">On Start</span>

1. Print:

   > 🟤 *"This skill currently handles naming refactors only. More refactoring types will be added in future iterations."*

2. Record the session timestamp (format: `YYYY-MM-DDThh-mm-ss`).

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

4. Create the flat log at `docs/refactorings/<folder>/<log-filename>`.
   Initialize with:
   ```
   ## Session Info
   Date: <timestamp>
   Models: <list every model used — primary agent first, then any sub-agents>
   Total Tokens: —

   ---

   ## Hypothesis

   ## Prediction

   ## Verdict

   ## Analysis

   ## Learnings

   ## Next Hypothesis

   ---

   ## Constants

   ## Functions

   ## Tests
   ```
   Immediately write the Date and Models values. Models must include the model name for every agent that ran during the session (e.g. `claude-sonnet-4-6`, `claude-opus-4-7`). If only one model was used, list one.

   Then write the absolute path of the log file to `~/.claude/refactor-session.tmp` using Bash:
   ```
   echo "/absolute/path/to/log.md" > ~/.claude/refactor-session.tmp
   ```
   This enables the Stop hook to automatically fill in Total Tokens at session end.

5. If a **folder** was given:
   - Scan all files, order by complexity simplest first (fewest functions, smallest LOC).
   - Print: 🟤 *"Processing files in this order:"* followed by the ordered list.

6. If a **single file** was given, proceed directly to step 7.

7. Ask in sequence — one question at a time, wait for each answer before asking the next.

   Present the hypothesis with a default pre-filled:

   > 🟠 *"What's your hypothesis for this refactor session?
   > (press Enter to accept default, or type your own)
   >
   > Default: 'I suspect not all the names in here are domain driven and some are not
   > written in prose and are instead written based on technology or implementation
   > based terms.'"*

   Then present the prediction with a default pre-filled:

   > 🟠 *"What's your prediction — what specifically would you expect to see if your hypothesis is true?
   > (press Enter to accept default, or type your own)
   >
   > Default: 'I expect to find a mix — some names will be fine, others will reference
   > technology concepts (String, Array, Handler, Manager, Utils) or describe what the
   > code does mechanically rather than what it means in the business. I don't expect
   > it to be uniformly bad.'"*

   If the user presses Enter or says "default" / "yes" / "ok", use the default text verbatim.
   Record both responses. Write them immediately to the `## Hypothesis` and `## Prediction` sections of the session log.

---

## <span style="color:#76a039">Processing Each File</span>

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

## <span style="color:#76a039">Proposal Format</span>

Present each rename as:

```
[File: src/utils/prompt.ts]

const buildSystemPromptString  →  buildSystemPrompt
Why: The name includes the type ("String") which is an implementation detail, not
     behavior. The name already implies it builds something; the return type is
     evident from context.

🟠 Accept? (yes / no)
```

### <span style="color:#76a039">Accept / Reject Flow</span>

- **yes** → apply the rename in the file, append to session log, move to next candidate.
- **no** → generate one alternative suggestion with a different name and explanation. Present in same format. Ask again.
- **no again** → skip silently. Log as rejected. Move on.

---

## <span style="color:#76a039">Naming Principles</span>

Apply in order:

1. **Describe behavior, not implementation.** `buildSystemPromptString` → `buildSystemPrompt`. "String" is the type, not the behavior.
2. **Use the business domain.** If the function formats Etsy listing data, prefer `formatListingOutput` over `formatData`.
3. **Read conditionals for clues.** If a function checks `if (user.isAdmin)`, the function probably guards admin access — name it accordingly.
4. **Well-written prose.** The name should complete *"this code..."* — `buildSystemPrompt` → *"this code builds the system prompt."* ✓ / `doPromptStuff` → *"this code does prompt stuff."* ✗
5. **No type suffixes.** Never include the type in the name: no `String`, `Array`, `List`, `Object`, `Bool`, `Int`.

---

## <span style="color:#76a039">Session Log</span>

After each proposal resolves, append to the session log (`docs/refactorings/<folder>/<log-filename>`) under the appropriate section.

Format:
```
## Hypothesis
I suspect not all the names in here are domain driven...

## Prediction
I expect to find a mix — some names will be fine, others will reference
technology concepts or describe what the code does mechanically.

## Verdict
partial

## Analysis
The hypothesis held partially. About half the names were acceptable...

## Learnings
A general hypothesis like this is hard to confirm or refute cleanly...

## Next Hypothesis
The coordination-layer functions are likely the worst...

---

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
- The experiment block (Hypothesis through Next Hypothesis) appears at the top, before the rename sections.
- The experiment block is written in two passes: Hypothesis and Prediction at session start; Verdict, Analysis, Learnings, Next Hypothesis at session end.
- Group renames by construct type: `## Constants`, `## Functions`, `## Tests`.
- Include both accepted and rejected proposals.
- No file or folder info — names only.
- If a rename section has no entries, write `(none this session)` under it.

---

## <span style="color:#76a039">At Session End — Analysis</span>

Before generating the tree diagram, produce the experiment analysis:

1. **Analysis** — what actually happened: which naming patterns appeared most (type suffixes, vague verbs, missing domain language), how many proposals were accepted vs. rejected and what that might indicate.
2. **Verdict** — a single explicit call: `confirmed`, `refuted`, or `partial`.
3. **Learnings** — what this session revealed that wasn't known before; what to do differently.
4. **Next Hypothesis** — what this session suggests should be tested next.

Present all four sections and ask:

> 🟠 *"Approve or reject this analysis?"*

- **approve** → write to the session log as-is (fill in the Verdict, Analysis, Learnings, Next Hypothesis sections).
- **reject** → prompt:

  > 🟠 *"Type your own analysis:"*

  Record whatever the user writes instead.

---

## <span style="color:#76a039">At Session End — Tree Diagram</span>

When all files have been processed, generate a Mermaid tree diagram using the claude-mermaid MCP tool and save it to `docs/refactorings/<folder>/<tree-filename>` (the tree filename was determined in step 3 of On Start).

The tree mirrors the **code structure** — not the construct-type grouping in the flat log. It shows which file was processed, which functions were entered, and what was renamed inside each function.

### <span style="color:#76a039">Diagram Structure</span>

```
%%{init: {"flowchart": {"useMaxWidth": false, "wrappingWidth": 1200}}}%%
graph TD
  FILE["<relative-file-path>"]
  FILE --> FN["<functionName>()"]
  FN --> RENAME1["const <oldName> → <newName> ✓"]
  FN --> RENAME2["fn <oldName> → <newName> ✗"]
```

### <span style="color:#76a039">Node Styling</span>

| Node type | Fill | Stroke | Extra |
|-----------|------|--------|-------|
| File | `#e8f0fe` | `#4a6cf7` | `font-weight:bold` |
| Function | `#fff8e1` | `#f0a500` | `font-weight:bold` |
| Accepted rename | `#d4edda` | `#28a745` | — |
| Rejected rename | `#f8d7da` | `#dc3545` | — |

### <span style="color:#76a039">Rules</span>

- Always use `%%{init: {"flowchart": {"useMaxWidth": false, "wrappingWidth": 1200}}}%%` so node text does not wrap.
- Every proposed rename (accepted or rejected) appears in the tree.
- Mark accepted with `✓` and rejected with `✗` at end of node label.
- If multiple files were processed, each file gets its own root node.

---

## <span style="color:#76a039">Error Handling</span>

- **`@` reference not found** → halt immediately. Print: 🟤 *"The file or folder `[path]` was not found. Please check the path and try again."*
- **File has no functions** → tell the user, skip the file, and continue to the next file if processing a folder.
- **`docs/refactorings/` can't be created** → halt and explain the problem. Do not proceed without a log file.
- **Mermaid MCP unavailable at session end** → write the `.mmd` source to disk anyway and note: 🟤 *"Diagram source saved to `[path]`. The Mermaid MCP tool was unavailable — open the file to render it manually."*
