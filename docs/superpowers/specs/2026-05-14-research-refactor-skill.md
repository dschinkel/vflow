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

Uses native Claude Code commands — no Superpowers required.

```
.claude/
  commands/
    refactor.md
```

A `.md` file in `.claude/commands/` becomes a slash command automatically. When `/refactor` is invoked, Claude Code reads the file and injects its content into context. No plugin, no `.skillfish.json`, no `Skill` tool call.

Vflow has no runtime code. It is purely a storage repo for command files. The thing that reads `refactor.md`, intercepts `/refactor`, and injects the content into context is Claude Code itself — no external framework needed.

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

The full experiment block is written at the top of the session log (e.g. `docs/refactorings/utils/refactor-names-utils-prompt-<timestamp>.md`), before the rename entries:

```
## Hypothesis
I suspect not all the names in here are domain driven and some are not written
in prose and are instead written based on technology or implementation based terms.

## Prediction
I expect to find a mix — some names will be fine, others will reference
technology concepts (String, Array, Handler, Manager, Utils) or describe
what the code does mechanically rather than what it means in the business.
I don't expect it to be uniformly bad.

## Verdict
partial

## Analysis
The hypothesis held partially. About half the names were acceptable —
a few already read as domain language. The other half leaned on
technology terms (String, Obj, Handler) or mechanism verbs ("process",
"handle", "manage") that describe the how not the what. No names were
actively wrong, but several were vague enough that a new developer
wouldn't know what business concept they referred to without reading
the implementation.

## Learnings
A general hypothesis like this is hard to confirm or refute cleanly —
"not all" is almost always true. Future sessions will be more useful
with a sharper prediction (e.g. "I expect more than half to have
technology terms"). The partial result also suggests this file is
mid-quality naming, not a disaster — the inside-out strategy found
fewer high-confidence renames than expected.

## Next Hypothesis
The weakest names were on the boundary functions — the ones that
coordinate between layers. I suspect those coordination-layer functions
are the most likely to have technology-focused names because they were
written to wire things together, not to express business intent.

---

## Constants
buildSystemPromptString -> buildListingPrompt [accepted]
inputDataObj -> product [accepted]
resultStr -> resultStr [rejected]

## Functions
handleResponse -> handleResponse [rejected]
processData -> generateColorSwatch [accepted]
formatOutput -> formatListingOutput [accepted]
manageState -> manageState [rejected]

## Tests
(none this session)
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

Each `/refactor` session produces two companion files, grouped under a subfolder named after the immediate parent folder of the target file or folder:

**Single file** (e.g. `src/utils/prompt.ts`):
```
docs/refactorings/utils/refactor-names-utils-prompt-<timestamp>.md       ← flat rename log
docs/refactorings/utils/refactor-names-utils-prompt-<timestamp>-tree.mmd ← Mermaid tree diagram
```

**Folder** (e.g. `src/utils/`):
```
docs/refactorings/utils/refactor-names-utils-<timestamp>.md       ← flat rename log
docs/refactorings/utils/refactor-names-utils-<timestamp>-tree.mmd ← Mermaid tree diagram
```

Created at session start, appended to after each proposal resolves (accept or final rejection).

### Flat Log

Starts with a `## Session Info` block written at session start, followed by the experiment block, then the rename entries:

```
## Session Info
Date: 2026-05-15T10-30-00
Models: claude-sonnet-4-6
Total Tokens: 24,318

---

## Hypothesis
...

## Prediction
...

## Verdict
...

## Analysis
...

## Learnings
...

## Next Hypothesis
...

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

- **Models** — written at session start; lists every model used (primary agent first, then any sub-agents).
- **Total Tokens** — filled in automatically at session end by a global Stop hook. The hook script lives at `hooks/stop-refactor-tokens.sh` in this repo and is installed to `~/.claude/hooks/` via `install.sh`. No user action required at runtime.

#### How Automatic Token Tracking Works

Token tracking is a three-part handoff between the command, Claude Code's session storage, and a Stop hook.

**1. Session start — command writes a state file**

When the command creates the log file, it immediately writes the log's absolute path to a known temp location:

```bash
echo "/abs/path/to/docs/refactorings/utils/refactor-names-utils-prompt-<timestamp>.md" > ~/.claude/refactor-session.tmp
```

This is the only piece the hook needs to locate the right log later.

**2. During the session — Claude Code accumulates token data**

As the session runs, Claude Code appends each exchange to a JSONL file at:

```
~/.claude/projects/<sanitized-cwd>/<session-id>.jsonl
```

Each assistant turn is a JSON object containing a `message.usage` block with per-turn token counts:

```json
{
  "message": {
    "usage": {
      "input_tokens": 3,
      "cache_creation_input_tokens": 8784,
      "cache_read_input_tokens": 11937,
      "output_tokens": 1055
    }
  }
}
```

**3. Session end — Stop hook fires automatically**

A global Stop hook in `~/.claude/settings.json` runs when Claude Code stops. It:

1. Reads `session_id` from the hook's stdin JSON
2. Checks for `~/.claude/refactor-session.tmp` — if missing, exits silently (not a refactor session)
3. Reads the log path from the state file, then deletes it
4. Derives the session JSONL path: `~/.claude/projects/$(pwd | sed 's|/|-|g')/$SESSION_ID.jsonl`
5. Sums all four token fields across every line in the JSONL:
   ```bash
   jq -r '.message.usage | select(.) | (.input_tokens // 0) + (.cache_creation_input_tokens // 0) + (.cache_read_input_tokens // 0) + (.output_tokens // 0)' "$SF" \
     | awk '{s+=$1} END{print s+0}'
   ```
6. Overwrites `Total Tokens: —` in the log with the real count via `sed`

The hook is global (not project-scoped) so it fires in any project where `/refactor` is run.

### Refactor Names Tree Diagram (claude-mermaid)

A completely different view from the flat log. Where the log groups by construct type, the tree mirrors the actual code structure — file → function → what was renamed inside that function. It shows *where* in the code the renames happened and how deep the skill went.

Example: if the skill entered `buildSystemPromptString()`, renamed a constant inside it, then renamed the function itself, the tree reflects that nesting:

<img src="refactor-tree-example.png" width="900" />

Accepted and rejected renames both appear (green / red). Generated by claude-mermaid at session end. Placed alongside the flat log so both views of the same session are always together.


---

## Quality Scoring Ideas

Each `/refactor` session produces a log and a hypothesis result. A quality score could add a third output: a measurable signal of how much the naming improved and where the worst problems were.

Three approaches worth considering:

### 1. Depth-of-change per rename

Rate each accepted rename at the moment it's logged on a 3-tier scale:

| Score | Label | Example |
|-------|-------|---------|
| `1` | Cosmetic polish | `buildSystemPromptString → buildSystemPrompt` (type suffix removed) |
| `2` | Behavioral shift | `processData → generateColorSwatch` (behavior named) |
| `3` | Domain discovery | `formatOutput → formatListingOutput` (business concept surfaced) |

Roll up to a session average. Captures not just *how many* names were fixed, but *how far* they moved.

### 2. Pre/post quality baseline

Before proposing any renames, Claude scores each existing name on a rubric (e.g. 1–5, with penalties for type suffixes, vague verbs, absent domain terms). After the session, re-score the accepted names. The delta is the session's quality improvement.

Enables cross-file and cross-session comparison. Higher delta = naming was worse to start with and improved more.

### 3. Anti-pattern hit rate

Don't score quality directly — count which problems appeared and how often:

- Type suffixes present (`String`, `Array`, `Handler`, etc.)
- Vague verbs (`process`, `handle`, `manage`, `do`, `run`)
- No domain term present
- Name describes mechanism, not meaning

Report as a breakdown in the Analysis section. Aligns well with the hypothesis/prediction flow — the prediction can name an expected pattern, and the score confirms or refutes it.

**Trade-off to resolve:** Options 1 and 2 require Claude to self-assess (subjective but richer). Option 3 is mechanical (consistent but shallower). Option 1 is lowest friction — it piggybacks on the accept moment with no extra prompts.

---

## Notes (from Anthropic Skills Guide)

_Reviewed against: The Complete Guide to Building Skills for Claude (Anthropic, 2026)_

Since vflow uses native Claude Code commands (not Superpowers), several of the original proposed changes no longer apply. Notes that remain relevant:

### Description field

The guide recommends trigger-phrase-focused descriptions. Native Claude Code commands support an optional `description:` in frontmatter — keep it short and trigger-focused:

> *"Use when user runs /refactor, asks to rename identifiers, variables, or functions, or says 'clean up naming' on a file or folder."*

### `allowed-tools` frontmatter

Claude Code natively supports `allowed-tools` in command frontmatter to restrict which tools the command can invoke:

```yaml
allowed-tools: "Read Edit Bash"
```

This is not Superpowers-specific — it works with native commands.

### Command file size

Keep `refactor.md` under 5,000 words. Large command bodies cause degraded performance.

### Error handling

The guide calls out error handling as required. The command file should cover:

- `@` reference not found → halt and tell the user
- File has no functions → tell the user and skip
- Mermaid MCP unavailable → write `.mmd` source to disk anyway
- `docs/refactorings/` can't be created → halt and explain

_(Error handling is already in the current `refactor.md`.)_

### No longer relevant

- `.skillfish.json` — Superpowers-only, not used
- `metadata:` block — Superpowers-only, not used
- `references/` vs `examples/` folder naming — only applies to the Superpowers multi-file skill structure; native commands are a single file

---

## Open Questions

- What constructs beyond constants and functions should be renamed? (variables, test names, React components — noted in original brainstorm but not yet scoped)
- Pattern matching against an existing codebase for consistency — noted as a future addition once the core skill works well
