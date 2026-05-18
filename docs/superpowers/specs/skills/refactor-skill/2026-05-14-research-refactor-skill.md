# Refactor Skill — Research Notes

> **Plans:** [Refactor Command Implementation Plan (archived)](../../../plans/archive/skills/2026-05-14-refactor-skill.md) — original `/refactor` build plan; `/refactor` has since gained the `--output <dir>` flag, see `commands/refactor.md` for current behavior. · [Stop Hook Cleanup Trap](../../../plans/2026-05-15-stop-hook-cleanup-trap.md)
_2026-05-14_
Note: this was partly based on feeding it my thoughts from `refactor-skill.txt`.

See also: `2026-05-14-research-refactor-skill_naming.md` for naming-specific research.

## What This Skill Does

`/refactor` is a Claude Code custom skill for refactoring codebases using good business domain language and well-written prose that describes behavior — not implementation details. This is a gap that both IDEs and agents have historically failed to close well out of the box.

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

## Global Naming Knowledge Base

Each `/refactor` session produces a session log capturing what was renamed and why. Across many sessions, a pattern builds up: what naming problems appear most often, what reasoning guided the decisions, what the user has pushed back on. That accumulated context is currently lost between sessions.

A global naming knowledge base would let the agent carry forward what it has learned — and let the user build a set of principles over time rather than re-explaining preferences every session.

### Two-layer design

**Layer 1 — Raw feedback log** (machine-written, append-only)

One file, auto-appended after each session, containing the raw rename entries with user annotations:

```
# vflow — 2026-05-15T16-32-10 — hooks/end-refactor-log-session-stats.sh
STATE -> REFACTOR_LOG_AWAITING_TOKEN_COUNT [accepted] — "use the why to name it, not a vague label"
SESSION_JSON -> REFACTOR_SESSION [accepted] — "represents a refactor session, not just a stopped session"
SF -> REFACTOR_SESSION_FILE [accepted] — "keep UPPERCASE, we're in a script"
```

This is a running log, not a curated one. It captures everything said, verbatim, in context.

**Layer 2 — Distilled principles** (user-curated, agent-read at session start)

A separate file the user edits manually — short, durable principles extracted from the raw log:

```
## Naming Principles (distilled from sessions)
- Name from the why, not the shape: if you can explain why something exists, use that explanation as the name.
- Script-level variables: UPPERCASE. Always.
- Avoid labels that describe a role without explaining what the thing actually represents.
```

The agent reads this file at session start, before proposing any renames. It informs how the agent generates names and what it anticipates the user will push back on.

### How it connects to session logs

The raw feedback log feeds the distilled principles. After several sessions, the user reads the raw log, notices patterns ("I keep rejecting names that have 'marker' or 'record' in them"), and writes a principle. Over time the principles layer gets richer and the agent gets better at generating names the user will accept.

The session log's `## Feedback` section (or inline annotations — see naming research doc) provides the raw material that gets appended to Layer 1.

### Open questions

- Where does the global knowledge base live? Options: inside the vflow repo (versioned), inside `~/.claude/` (personal, global), or both.
- Should the agent prompt the user at session end to review the raw feedback and propose a distilled principle? Or leave curation entirely to the user?
- Should the agent reference specific past sessions in its reasoning ("In the hooks session, you said to name from the why — applying that here...")?
- How does the knowledge base stay relevant as the user's preferences evolve? Principles that were true early on may be superseded later.

---

## Custom Hooks

Two shell scripts extend the `/refactor` skill via Claude Code's hook system. Both are installed globally via `install.sh` so they fire in any project where `/refactor` is run.

**Hook events used:**

- `UserPromptSubmit` — fires on every prompt submission, before Claude processes it. Lets a script inspect or block a prompt before it reaches the model.
- `Stop` — fires after every agent response turn, not just when the full conversation ends. It runs silently after each Claude reply. In practice this means `end-refactor-log-session-stats.sh` runs constantly — it just exits early (0) when `~/.claude/refactor-session.tmp` doesn't exist, so it's invisible. It only becomes visible when that file is present.

### start-refactor-skill.sh (`UserPromptSubmit`)

Guards against starting a `/refactor` session when there isn't enough context window remaining to complete it. Exits silently for non-`/refactor` prompts and fresh sessions. If the threshold isn't met, returns `{"continue": false, "stopReason": "..."}` to block the session and surface a message to the user.

Thresholds: Sonnet requires ≥ 90% remaining; Opus requires ≥ 80% remaining.

### end-refactor-log-session-stats.sh (`Stop`)

Writes the session's total token count into the refactor session log. Fires after every agent response turn — but exits silently unless `~/.claude/refactor-session.tmp` exists, so it has no effect outside a `/refactor` session.

**Stale state file:** If a `/refactor` session ends abruptly (e.g. context exhausted) without running the session-end flow, `~/.claude/refactor-session.tmp` is never deleted. The hook will then fire visibly on subsequent turns in any session until the file is manually removed (`rm ~/.claude/refactor-session.tmp`) or a new `/refactor` session overwrites it. Token tracking is a three-part handoff between the command, Claude Code's session storage, and this hook.

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

Each assistant turn contains a `message.usage` block with per-turn token counts:

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

Registered in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "bash ~/.claude/hooks/end-refactor-log-session-stats.sh" }
        ]
      }
    ]
  }
}
```

When the hook fires, it:

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

---

## Open Questions

- Pattern matching against an existing codebase for consistency — noted as a future addition once the core skill works well
- Global naming knowledge base: raw feedback log + distilled principles — see above for design options
