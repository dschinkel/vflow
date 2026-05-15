# Refactor Skill — Research Notes
_2026-05-14_
Note: this was partly based on feeding it my thoughts from `refactor-skill.txt`.

## What This Skill Does

`/refactor` is a Claude Code custom skill for renaming things in a codebase using good business domain language and well-written prose that describes behavior — not implementation details. This is a gap that both IDEs and agents have historically failed to close well out of the box.

This is being built iteratively. **Naming is the first and only refactoring type in scope right now.**

---

## Invocation

```
/refactor @<file-or-folder>
```

- The `@` reference is required. If omitted, the skill halts and asks for one.
- If a folder is given, the skill announces upfront which file it starts with (simplest first) and the order it will walk through the rest.
- The skill always displays the currently processed file at the top of every message.
- On start, the skill states clearly: *"This skill currently handles naming refactors only. More refactoring types will be added in future iterations."*

---

## Skill Format

Uses Option 2 from the `.claude` folder research: `.claude/skills/` with a subfolder per skill.

```
.claude/
  skills/
    refactor/
      SKILL.md
      examples/
      templates/
      .skillfish.json
```

The framework that runs this is external (Superpowers). Vflow just holds the skills.

---

## Processing Strategy (Inside-Out)

Code-first — no upfront domain interview. The inside-out strategy is the inference mechanism: by reading constants and conditionals before naming a function, the agent builds domain context organically from the code itself.

For each file:

1. Pick the **smallest function** in the file
2. Inside that function, identify **constants** — propose renames first
3. **Note any conditionals** — read their branches to understand what behavior the function is guarding
4. Use constants and conditional behavior to **propose a rename for the function itself**
5. Move to the next smallest function and repeat
6. When all functions in a file are done, move to the next file

---

## Hypothesis & Analysis

Each `/refactor` session is treated as an experiment. The user states their hypothesis upfront, and the skill produces an analysis at the end for review.

### On Start — Hypothesis Prompt

After announcing scope and file order, the skill asks:

```
What's your hypothesis for this refactor session?
(e.g. "I think most names are implementation-focused and miss the business domain")
```

The user's response is recorded verbatim and written to the session log immediately.

### At Session End — Analysis

After all renames are processed (and before generating the tree diagram), the skill produces an analysis covering:
- Which naming patterns appeared most (type suffixes, vague verbs, missing domain language, etc.)
- How many proposals were accepted vs. rejected and what that might indicate
- Whether the hypothesis held up based on what was actually found

The skill then asks:

```
Analysis above — approve or reject?
```

- **approve** → analysis is written to the session log as-is.
- **reject** → skill prompts: *"Type your own analysis:"* and records whatever the user writes instead.

### In the Session Log

The hypothesis and final analysis are written at the top of `docs/refactorings/refactor-names-<session-timestamp>.md`, before the rename entries:

```
## Hypothesis
I think most names here are implementation-focused and miss the business domain entirely.

## Analysis
The hypothesis held. 8 of 11 constants included type suffixes (String, Obj, Array).
Function names described mechanism not behavior — "build", "format", "process" with
no domain context. The conditional reads revealed the actual domain (listing generation,
SVG processing) was never surfaced in any identifier.

---

## Constants
...
```

---

## Proposal Format

Each rename proposal looks like:

```
[File: src/utils/prompt.ts]

const buildSystemPromptString  →  buildSystemPrompt
Why: the name includes the type ("String") which is an implementation detail,
     not behavior. The name already implies it builds something; the return
     type is evident from context.

Accept? (yes / no)
```

- If **accepted**: apply the rename, append to session log, move on.
- If **rejected**: try one more suggestion with a different name + explanation.
- If **rejected again**: skip silently, move on.

---

## Session Log

Each `/refactor` session produces two companion files in `docs/refactorings/`:

```
docs/refactorings/refactor-names-<session-timestamp>.md       ← flat rename log
docs/refactorings/refactor-names-<session-timestamp>-tree.mmd ← Mermaid tree diagram
```

Created at session start, appended to after each proposal resolves (accept or final rejection).

### Flat Log

All rename proposals — accepted and rejected — grouped by construct type. No file/folder info:

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
### Refactor Names Tree Diagram (claude-mermaid)

A completely different view from the flat log. Where the log groups by construct type, the tree mirrors the actual code structure — file → function → what was renamed inside that function. It shows *where* in the code the renames happened and how deep the skill went.

Example: if the skill entered `buildSystemPromptString()`, renamed a constant inside it, then renamed the function itself, the tree reflects that nesting:

<img src="refactor-tree-example.png" width="900" />

Accepted and rejected renames both appear (green / red). Generated by claude-mermaid at session end. Placed alongside the flat log so both views of the same session are always together.


---

## Open Questions

- What constructs beyond constants and functions should be renamed? (variables, test names, React components — noted in original brainstorm but not yet scoped)
- Pattern matching against an existing codebase for consistency — noted as a future addition once the core skill works well
