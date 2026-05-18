# <span style="color:#76a039">Refactor Skill — Mid-Session Context Guard</span>

> **Plan:** [Mid-Session Context Guard Implementation Plan](../../../../plans/2026-05-15-refactor-skill-mid-session-context-guard.md)
_2026-05-15_

A `PreToolUse` hook that fires during an active `/refactor` session and warns the user before the context window fills up entirely, giving Claude enough room to stop gracefully and prompt a restart.

---

## <span style="color:#76a039">Problem</span>

The existing `start-refactor-skill.sh` (`UserPromptSubmit` hook) blocks a `/refactor` invocation if the context is already too full at the time the command is typed. But it cannot guard against context filling up *during* the session — e.g. a long folder refactor that starts with plenty of room but exhausts the window mid-run. When that happens, the session ends abruptly, the session log is left with blank Verdict/Analysis/Learnings, and no tree diagram is generated.

---

## <span style="color:#76a039">Solution</span>

A new `PreToolUse` hook — `mid-refactor-context-guard.sh` — that fires before every tool call during an active refactor session and blocks the tool if remaining context has dropped below a safe threshold. When blocked, Claude surfaces the reason to the user immediately, before the next tool call is attempted.

---

## <span style="color:#76a039">Hook: `mid-refactor-context-guard.sh`</span>

### <span style="color:#76a039">Trigger</span>

`PreToolUse` — fires before every tool call.

During a `/refactor` session, Claude continuously calls tools internally as it works: `Read` to open each file, `Edit` to apply renames, `Bash` to write to the session log. Every one of those internal tool calls triggers `PreToolUse` before it executes — regardless of whether the user has typed anything. This is what makes it the right hook for a mid-session guard: it fires continuously throughout the session (potentially dozens of times per file), not just on user input.

Compare with `UserPromptSubmit` (used by the start guard): that hook only fires when the user submits a prompt. `PreToolUse` fires every time Claude reaches for a tool — a fundamentally different and much higher cadence.

### <span style="color:#76a039">Guards (exit 0 / passthrough)</span>

- No active refactor session: `~/.claude/refactor-session.tmp` does not exist → exit 0.
- Session JSONL not found → exit 0 (fresh session, nothing to read).
- Context usage unreadable → exit 0 (fail open, don't block unnecessarily).

### <span style="color:#76a039">Context Check</span>

Read the most recent turn's total input tokens from the session JSONL (same calculation as `start-refactor-skill.sh`):

```
input_tokens + cache_creation_input_tokens + cache_read_input_tokens
```

Compute remaining percentage:

```
remaining_percent = 100 - (recent_input * 100 / context_window)
```

### <span style="color:#76a039">Thresholds</span>

| Model | Block if remaining < |
|-------|----------------------|
| Sonnet (default) | 5% |
| Opus | 5% |

> **Why 5% not 1%?** At 1% remaining (~2,000 tokens of a 200k window), Claude may not have enough context to compose and deliver the warning message at all. 5% (~10,000 tokens) gives it enough room to stop cleanly, explain what happened, and tell the user what to do next.

### <span style="color:#76a039">Block Response</span>

When threshold is crossed, return:

```json
{
  "continue": false,
  "stopReason": "Context window is nearly full (~{remaining_pct}% remaining). The /refactor session cannot continue safely. Please start a new Claude Code session and re-run /refactor to pick up where you left off. The session log has been preserved at: {log_path}"
}
```

- `{remaining_pct}` — integer, e.g. `4`
- `{log_path}` — contents of `~/.claude/refactor-session.tmp` (the session log path written at session start)

### <span style="color:#76a039">Installation</span>

Installed to `~/.claude/hooks/mid-refactor-context-guard.sh` by `install.sh`. Registered in `~/.claude/settings.json` under `PreToolUse`.

---

## <span style="color:#76a039">Settings Registration</span>

```json
"PreToolUse": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "bash /Users/zevia/.claude/hooks/mid-refactor-context-guard.sh"
      }
    ]
  }
]
```

---

## <span style="color:#76a039">Open Questions</span>

1. **Threshold** — 5% is a reasonable starting point but untested. Should it be configurable in the hook script (a variable at the top) so it's easy to tune?
2. **Partial session log** — when the guard fires, the log has incomplete Verdict/Analysis/Learnings and no tree. Should the guard also write a `## Interrupted` section to the log noting the reason, so the log isn't just silently incomplete?
3. **Resume guidance** — the stop message tells the user to "re-run /refactor to pick up where you left off" but the skill has no resume logic. Should the message be more honest: "re-run /refactor on the same file/folder — some renames may be re-proposed"?
