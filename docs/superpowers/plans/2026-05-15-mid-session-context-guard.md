# Mid-Session Context Guard Implementation Plan

> **Spec:** [Refactor Skill — Mid-Session Context Guard](../specs/skills/refactor-skill/2026-05-15-research-refactor-skill_mid-session-context-guard.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `PreToolUse` hook that fires during active `/refactor` sessions and blocks tool execution with a user-facing warning when the context window drops below a safe threshold.

**Architecture:** A new bash hook script (`mid-refactor-context-guard.sh`) registered under `PreToolUse` in `~/.claude/settings.json`. It fires before every tool call, exits silently when no refactor session is active, and returns a JSON block with a human-readable message when context is critically low. `install.sh` is extended to register the new hook type alongside the existing Stop and UserPromptSubmit entries.

**Tech Stack:** Bash, jq, Claude Code hooks (`PreToolUse`)

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `hooks/mid-refactor-context-guard.sh` | Create | The guard hook script |
| `hooks/tests/test-mid-refactor-context-guard.sh` | Create | Smoke test script |
| `install.sh` | Modify | Add `PreToolUse` registration block |

---

## Task 1: Write the Failing Smoke Test

**Files:**
- Create: `hooks/tests/test-mid-refactor-context-guard.sh`

- [ ] **Step 1: Create the test file**

```bash
#!/usr/bin/env bash
# Smoke tests for mid-refactor-context-guard.sh
# Run: bash hooks/tests/test-mid-refactor-context-guard.sh

set -euo pipefail

HOOK="$(cd "$(dirname "$0")/.." && pwd)/mid-refactor-context-guard.sh"
PASS=0
FAIL=0

pass() { echo "  PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

# --- Setup helpers ---

make_session_jsonl() {
  local path="$1" input_tokens="$2"
  echo "{\"message\":{\"usage\":{\"input_tokens\":$input_tokens,\"cache_creation_input_tokens\":0,\"cache_read_input_tokens\":0,\"output_tokens\":1000}}}" > "$path"
}

make_stdin() {
  local session_id="$1"
  echo "{\"session_id\":\"$session_id\",\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"/some/file.sh\"}}"
}

# --- Test 1: No active refactor session → passthrough (exit 0, no output) ---

echo "Test 1: no active session"
TMP_STATE=$(mktemp)
rm -f "$TMP_STATE"  # ensure it doesn't exist

output=$(make_stdin "sess-1" | HOME="$(dirname "$TMP_STATE")" bash "$HOOK" 2>/dev/null || true)
if [ -z "$output" ]; then
  pass "exits silently when refactor-session.tmp absent"
else
  fail "expected no output, got: $output"
fi

# --- Test 2: Active session, tokens well within limit → passthrough ---

echo "Test 2: active session, context healthy (5% used)"
TMP_HOME=$(mktemp -d)
mkdir -p "$TMP_HOME/.claude/projects/-$(echo "$TMP_HOME" | sed 's|/|-|g')"
SESSION_ID="sess-healthy"
SESSION_FILE="$TMP_HOME/.claude/projects/-$(echo "$TMP_HOME" | sed 's|/|-|g')/$SESSION_ID.jsonl"
LOG_FILE="$TMP_HOME/refactor-log.md"
touch "$LOG_FILE"
make_session_jsonl "$SESSION_FILE" 10000  # 5% of 200k
echo "$LOG_FILE" > "$TMP_HOME/.claude/refactor-session.tmp"

output=$(make_stdin "$SESSION_ID" | HOME="$TMP_HOME" bash "$HOOK" 2>/dev/null || true)
if [ -z "$output" ]; then
  pass "exits silently when context is healthy"
else
  fail "expected no output, got: $output"
fi
rm -rf "$TMP_HOME"

# --- Test 3: Active session, tokens critically high → block with message ---

echo "Test 3: active session, context critically low (~2% remaining)"
TMP_HOME=$(mktemp -d)
mkdir -p "$TMP_HOME/.claude/projects/-$(echo "$TMP_HOME" | sed 's|/|-|g')"
SESSION_ID="sess-full"
SESSION_FILE="$TMP_HOME/.claude/projects/-$(echo "$TMP_HOME" | sed 's|/|-|g')/$SESSION_ID.jsonl"
LOG_FILE="$TMP_HOME/refactor-log.md"
echo "## Session Info" > "$LOG_FILE"
make_session_jsonl "$SESSION_FILE" 196000  # ~98% of 200k
echo "$LOG_FILE" > "$TMP_HOME/.claude/refactor-session.tmp"

output=$(make_stdin "$SESSION_ID" | HOME="$TMP_HOME" bash "$HOOK" 2>/dev/null || true)
if echo "$output" | jq -e '."continue" == false' > /dev/null 2>&1; then
  pass "returns continue:false when context is critical"
else
  fail "expected continue:false, got: $output"
fi

if echo "$output" | jq -r '.stopReason' | grep -q "new Claude Code session"; then
  pass "stopReason tells user to start a new session"
else
  fail "stopReason missing restart instruction, got: $(echo "$output" | jq -r '.stopReason')"
fi

if grep -q "## Interrupted" "$LOG_FILE"; then
  pass "writes ## Interrupted to session log"
else
  fail "expected ## Interrupted in log"
fi

if [ ! -f "$TMP_HOME/.claude/refactor-session.tmp" ]; then
  pass "deletes refactor-session.tmp when blocking"
else
  fail ".tmp still present after guard fired"
fi
rm -rf "$TMP_HOME"

# --- Test 4: Session JSONL missing → passthrough ---

echo "Test 4: session JSONL not found → passthrough"
TMP_HOME=$(mktemp -d)
mkdir -p "$TMP_HOME/.claude"
LOG_FILE="$TMP_HOME/refactor-log.md"
touch "$LOG_FILE"
echo "$LOG_FILE" > "$TMP_HOME/.claude/refactor-session.tmp"
# intentionally do NOT create the session JSONL

output=$(make_stdin "sess-missing" | HOME="$TMP_HOME" bash "$HOOK" 2>/dev/null || true)
if [ -z "$output" ]; then
  pass "exits silently when session JSONL is missing"
else
  fail "expected no output, got: $output"
fi
rm -rf "$TMP_HOME"

# --- Summary ---
echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
```

- [ ] **Step 2: Run the test to confirm it fails (hook doesn't exist yet)**

```bash
bash hooks/tests/test-mid-refactor-context-guard.sh
```

Expected: errors because `hooks/mid-refactor-context-guard.sh` doesn't exist yet.

- [ ] **Step 3: Commit the failing test**

```bash
git add hooks/tests/test-mid-refactor-context-guard.sh
git commit -m "test: add smoke tests for mid-session context guard (red)"
```

---

## Task 2: Write the Hook Script

**Files:**
- Create: `hooks/mid-refactor-context-guard.sh`

- [ ] **Step 1: Create the script**

```bash
#!/usr/bin/env bash
# Fires before every tool call (PreToolUse hook).
# During an active /refactor session, checks whether the context window is
# critically low. If it is, blocks the tool and tells the user to start a
# new session. Exits silently (0) for all non-refactor sessions or when
# context is healthy.

set -euo pipefail

# Remaining context threshold — block if less than this percent is left.
# 5% of a 200k window = ~10,000 tokens: enough for Claude to deliver the
# warning message cleanly. Tune this variable to adjust sensitivity.
MIN_REMAINING_PERCENT=5

CONTEXT_WINDOW=200000
STATE_FILE="$HOME/.claude/refactor-session.tmp"

STDIN_JSON=$(cat)
session_id=$(echo "$STDIN_JSON" | jq -r '.session_id // ""')

# Guard: no active refactor session
[ -f "$STATE_FILE" ] || exit 0

# Guard: no session ID
[ -n "$session_id" ] || exit 0

# Locate session JSONL
project_key=$(pwd | sed 's|/|-|g')
session_file="$HOME/.claude/projects/$project_key/$session_id.jsonl"

# Guard: session JSONL not found yet (fresh session)
[ -f "$session_file" ] || exit 0

# Read most recent turn's total input tokens
recent_input=$(jq -s '[.[] | select(.message.usage != null) | .message.usage |
  (.input_tokens // 0) +
  (.cache_creation_input_tokens // 0) +
  (.cache_read_input_tokens // 0)] | last // 0' "$session_file" 2>/dev/null || echo 0)

# Guard: unreadable token count — fail open
[ "$recent_input" -gt 0 ] || exit 0

used_percent=$(( recent_input * 100 / CONTEXT_WINDOW ))
remaining_percent=$(( 100 - used_percent ))

# Context is healthy — allow the tool call
[ "$remaining_percent" -lt "$MIN_REMAINING_PERCENT" ] || exit 0

# Context is critical — read the log path, write ## Interrupted, and clean up state
log_path=$(cat "$STATE_FILE")
rm -f "$STATE_FILE"
if [ -n "$log_path" ] && [ -f "$log_path" ]; then
  printf '\n## Interrupted\nContext window exhausted (~%d%% remaining). Session ended by mid-session guard.\n' \
    "$remaining_percent" >> "$log_path"
fi

jq -n \
  --argjson remaining "$remaining_percent" \
  --arg log "$log_path" \
  '{
    "continue": false,
    "stopReason": ("Context window is nearly full (only ~" + ($remaining|tostring) + "% remaining). The /refactor session cannot continue safely.\n\nPlease start a new Claude Code session and re-run /refactor on the same file or folder. Note: some renames may be re-proposed.\n\nYour session log has been preserved at: " + $log)
  }'
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x hooks/mid-refactor-context-guard.sh
```

- [ ] **Step 3: Run the smoke tests — expect all to pass**

```bash
bash hooks/tests/test-mid-refactor-context-guard.sh
```

Expected output:
```
Test 1: no active session
  PASS: exits silently when refactor-session.tmp absent
Test 2: active session, context healthy (5% used)
  PASS: exits silently when context is healthy
Test 3: active session, context critically low (~2% remaining)
  PASS: returns continue:false when context is critical
  PASS: stopReason tells user to start a new session
  PASS: writes ## Interrupted to session log
  PASS: deletes refactor-session.tmp when blocking
Test 4: session JSONL not found → passthrough
  PASS: exits silently when session JSONL is missing

Results: 7 passed, 0 failed
```

- [ ] **Step 4: Commit**

```bash
git add hooks/mid-refactor-context-guard.sh
git commit -m "feat: add mid-session context guard PreToolUse hook"
```

---

## Task 3: Register the Hook in install.sh

**Files:**
- Modify: `install.sh`

- [ ] **Step 1: Add the PreToolUse registration block after the UserPromptSubmit block**

Append this block before the final `echo "Done..."` line in `install.sh`:

```bash
# --- settings: merge PreToolUse hook entry ---
CONTEXT_GUARD_HOOK_COMMAND="bash $HOOKS_DIR/mid-refactor-context-guard.sh"

if jq -e --arg cmd "$CONTEXT_GUARD_HOOK_COMMAND" \
  '.hooks.PreToolUse[]?.hooks[]? | select(.command == $cmd)' \
  "$SETTINGS" > /dev/null 2>&1; then
  echo "PreToolUse hook already registered in $SETTINGS — skipping"
else
  TMP=$(mktemp)
  jq --arg cmd "$CONTEXT_GUARD_HOOK_COMMAND" \
    '.hooks.PreToolUse //= [] | .hooks.PreToolUse += [{"hooks": [{"type": "command", "command": $cmd}]}]' \
    "$SETTINGS" > "$TMP" && mv "$TMP" "$SETTINGS"
  echo "registered PreToolUse hook in $SETTINGS"
fi
```

- [ ] **Step 2: Run install.sh and verify**

```bash
bash install.sh
```

Expected output includes:
```
installed hook:    mid-refactor-context-guard.sh
registered PreToolUse hook in /Users/<you>/.claude/settings.json
```

- [ ] **Step 3: Confirm settings.json has the PreToolUse entry**

```bash
jq '.hooks.PreToolUse' ~/.claude/settings.json
```

Expected:
```json
[
  {
    "hooks": [
      {
        "type": "command",
        "command": "bash /Users/<you>/.claude/hooks/mid-refactor-context-guard.sh"
      }
    ]
  }
]
```

- [ ] **Step 4: Commit**

```bash
git add install.sh
git commit -m "feat: register mid-session context guard in install.sh"
```
