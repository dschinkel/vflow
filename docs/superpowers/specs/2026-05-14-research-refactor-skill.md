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

After announcing scope and file order, the skill asks two questions in sequence:

```
1. What's your hypothesis for this refactor session?
   (e.g. "I think most names are implementation-focused and miss the business domain")

2. What's your prediction — what specifically would you expect to see if your hypothesis is true?
   (e.g. "I expect to find type suffixes in more than half the constants, and function
   names using build/format/process with no domain context")
```

Both responses are recorded verbatim and written to the session log immediately.

### At Session End — Analysis, Verdict & Learnings

After all renames are processed (and before generating the tree diagram), the skill produces:

1. **Analysis** — what actually happened:
   - Which naming patterns appeared most (type suffixes, vague verbs, missing domain language, etc.)
   - How many proposals were accepted vs. rejected and what that might indicate

2. **Verdict** — a single explicit call based on whether the prediction held: `confirmed`, `refuted`, or `partial`

3. **Learnings** — what this session revealed that wasn't known before; what to do differently

4. **Next Hypothesis** — what this session suggests should be tested next

The skill presents all four sections and asks:

```
Approve or reject this analysis?
```

- **approve** → written to the session log as-is.
- **reject** → skill prompts: *"Type your own analysis:"* and records whatever the user writes instead.

### In the Session Log

The full experiment block is written at the top of `docs/refactorings/refactor-names-<session-timestamp>.md`, before the rename entries:

```
## Hypothesis
I think the names here are implementation-focused — lots of type suffixes and
generic verbs with no domain language from the listing generation business.

## Prediction
I expect to find type suffixes (String, Obj, Array) in more than half the
constants, and function names that use "build/format/process" with no
Etsy or listing context.

## Verdict
confirmed

## Analysis
7 of 9 constants had type suffixes. Function names used mechanism words
with no domain reference. Conditional reads revealed the domain was never
surfaced in any identifier.

## Learnings
The inside-out strategy worked well — reading constants first gave enough
context to propose strong function renames without asking the user for
domain context upfront.

## Next Hypothesis
The test files likely mirror the same naming problems — test names probably
describe implementation not behavior.

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

## Proposed Changes (from Anthropic Skills Guide)

_Reviewed against: The Complete Guide to Building Skills for Claude (Anthropic, 2026)_

### 1. Description field is incomplete

The guide requires description to include **both** what the skill does AND when to use it, with specific trigger phrases users would actually say. Current description:

> *"Use when the user runs /refactor and provides a file or folder reference to rename identifiers using business domain language and behavioral prose."*

Missing the "what it does" half and has no natural-language trigger phrases. Should be closer to:

> *"Renames identifiers using business domain language and behavioral prose, following an inside-out strategy through the code structure. Use when user runs /refactor, asks to rename variables or functions, or says 'clean up naming' on a file or folder."*

**Tension to note:** The Superpowers `writing-skills` skill says description should contain triggering conditions only — no workflow summary — because Claude may shortcut the skill body if the description summarizes behavior. The Anthropic guide says include both what and when. These conflict. Resolution: lean toward the Superpowers guidance for now since it's based on observed Claude behavior, but include trigger phrases as the Anthropic guide requires.

---

### 2. `.skillfish.json` is not part of the official Anthropic skill spec

The guide makes no mention of `.skillfish.json`. It is Superpowers-specific. The official format requires only `SKILL.md` with YAML frontmatter. Metadata fields (`author`, `version`, `category`, `tags`) belong inside a `metadata:` block in the frontmatter — not in a separate file.

The `.skillfish.json` can remain for Superpowers compatibility, but the SKILL.md frontmatter should also carry the metadata block:

```yaml
---
name: refactor
description: ...
metadata:
  author: Dave Schinkel
  version: 0.1.0
  category: refactoring
  tags: [naming, domain-language, xp, refactoring]
---
```

---

### 3. `allowed-tools` frontmatter field — not yet used

The guide documents an optional `allowed-tools` field to restrict which tools the skill can invoke. For the refactor skill this is useful — it only needs `Read`, `Edit`, and `Bash` (for the Mermaid MCP call at session end):

```yaml
allowed-tools: "Read Edit Bash"
```

---

### 4. `references/` not `examples/`

The official folder structure uses `references/` for supporting documentation, not `examples/`. If we add supporting docs in the future (naming principles reference, XP refactoring catalog, etc.) they go in `references/`, not `examples/`.

---

### 5. Error handling missing from SKILL.md

The guide explicitly calls out error handling as required. Current SKILL.md has none. At minimum, these cases need to be covered:

- `@` reference points to a file that doesn't exist → halt and tell the user
- `@` reference points to a file with no functions → tell the user and skip the file
- Mermaid MCP tool unavailable at session end → write the `.mmd` source file anyway and note the diagram could not be rendered
- `docs/refactorings/` directory can't be created → halt and explain

---

### 6. SKILL.md body should stay under 5,000 words

The guide warns that large skill bodies cause degraded performance. Current SKILL.md is well within that limit but worth tracking as more sections are added.

---

## Open Questions

- What constructs beyond constants and functions should be renamed? (variables, test names, React components — noted in original brainstorm but not yet scoped)
- Pattern matching against an existing codebase for consistency — noted as a future addition once the core skill works well
- Resolve the description field tension: Superpowers (triggers only) vs. Anthropic guide (what + when + triggers)
