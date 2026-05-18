# <span style="color:#76a039">Stop Hook — Guaranteed Cleanup Trap Implementation Plan</span>

> **Spec:** [Refactor Skill — Research Notes](../specs/skills/refactor-skill/2026-05-14-research-refactor-skill.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ensure `~/.claude/refactor-session.tmp` is always deleted when `end-refactor-log-session-stats.sh` runs, even if the hook errors mid-execution, by adding a `trap` that fires on any exit.

**Architecture:** Add `trap 'rm -f "$REFACTOR_LOG_AWAITING_TOKEN_COUNT"' EXIT` to the Stop hook, after the state file variable is defined but before `main` runs. The trap fires on any exit — clean, errored, or signalled — so the stale file can never persist due to a mid-hook failure.

**Tech Stack:** Bash, Claude Code Stop hook

---

## <span style="color:#76a039">File Structure</span>

| File | Action | Purpose |
|------|--------|---------|
| `hooks/end-refactor-log-session-stats.sh` | Modify | Add EXIT trap for guaranteed cleanup |
| `hooks/tests/test-stop-hook-cleanup-trap.sh` | Create | Smoke test verifying trap fires on error |

---

## <span style="color:#76a039">Task 1: Write the Failing Smoke Test</span>

**Files:**
- Create: `hooks/tests/test-stop-hook-cleanup-trap.sh`

- [x] **Step 1: Create the test file**

```bash
#!/usr/bin/env bash
# Smoke tests for the EXIT trap in end-refactor-log-session-stats.sh
# Run: bash hooks/tests/test-stop-hook-cleanup-trap.sh

set -euo pipefail

HOOK="$(cd "$(dirname "$0")/.." && pwd)/end-refactor-log-session-stats.sh"
PASS=0
FAIL=0

pass() { echo "  PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

# --- Test 1: No active session → .tmp not touched ---

echo "Test 1: no active session, no .tmp file"
TMP_HOME=$(mktemp -d)
mkdir -p "$TMP_HOME/.claude"

echo '{"session_id":"sess-1"}' | HOME="$TMP_HOME" bash "$HOOK" 2>/dev/null || true

if [ ! -f "$TMP_HOME/.claude/refactor-session.tmp" ]; then
  pass "no .tmp created when no session active"
else
  fail "unexpected .tmp file appeared"
fi
rm -rf "$TMP_HOME"

# --- Test 2: Active session, hook completes normally → .tmp deleted ---

echo "Test 2: active session, normal completion → .tmp removed"
TMP_HOME=$(mktemp -d)
mkdir -p "$TMP_HOME/.claude"
LOG_FILE="$TMP_HOME/refactor-log.md"
printf '## Session Info\nDate: 2026-05-15T00-00-00\nModels: claude-sonnet-4-6\nTotal Tokens: —\n' > "$LOG_FILE"
echo "$LOG_FILE" > "$TMP_HOME/.claude/refactor-session.tmp"
# No session JSONL — hook will claim the log and exit cleanly without writing tokens

echo '{"session_id":"sess-normal"}' | HOME="$TMP_HOME" bash "$HOOK" 2>/dev/null || true

if [ ! -f "$TMP_HOME/.claude/refactor-session.tmp" ]; then
  pass ".tmp deleted on normal exit"
else
  fail ".tmp still present after normal exit"
fi
rm -rf "$TMP_HOME"

# --- Test 3: Active session, hook receives invalid JSON → .tmp still deleted ---

echo "Test 3: malformed stdin → .tmp still deleted by trap"
TMP_HOME=$(mktemp -d)
mkdir -p "$TMP_HOME/.claude"
LOG_FILE="$TMP_HOME/refactor-log.md"
touch "$LOG_FILE"
echo "$LOG_FILE" > "$TMP_HOME/.claude/refactor-session.tmp"

echo 'NOT_VALID_JSON' | HOME="$TMP_HOME" bash "$HOOK" 2>/dev/null || true

if [ ! -f "$TMP_HOME/.claude/refactor-session.tmp" ]; then
  pass ".tmp deleted even when hook errors on bad JSON"
else
  fail ".tmp still present after hook error — trap not working"
fi
rm -rf "$TMP_HOME"

# --- Summary ---
echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
```

- [x] **Step 2: Run the test to confirm Test 3 fails (no trap yet)**

```bash
bash hooks/tests/test-stop-hook-cleanup-trap.sh
```

Expected: Test 3 fails with `.tmp still present after hook error — trap not working`.

- [x] **Step 3: Commit the failing test**

```bash
git add hooks/tests/test-stop-hook-cleanup-trap.sh
git commit -m "test: add smoke test for Stop hook EXIT trap cleanup (red)"
```

---

## <span style="color:#76a039">Task 2: Add the EXIT Trap to the Hook</span>

**Files:**
- Modify: `hooks/end-refactor-log-session-stats.sh`

- [x] **Step 1: Add the trap immediately after the state file variable is defined**

The current file opens with:

```bash
set -euo pipefail

REFACTOR_LOG_AWAITING_TOKEN_COUNT="$HOME/.claude/refactor-session.tmp"
```

Change it to:

```bash
set -euo pipefail

REFACTOR_LOG_AWAITING_TOKEN_COUNT="$HOME/.claude/refactor-session.tmp"

# Always remove the state file on exit — clean, errored, or signalled.
# Prevents stale .tmp files from making the hook fire visibly in future sessions.
trap 'rm -f "$REFACTOR_LOG_AWAITING_TOKEN_COUNT"' EXIT
```

- [x] **Step 2: Run the smoke tests — expect all to pass**

```bash
bash hooks/tests/test-stop-hook-cleanup-trap.sh
```

Expected output:
```
Test 1: no active session, no .tmp file
  PASS: no .tmp created when no session active
Test 2: active session, normal completion → .tmp removed
  PASS: .tmp deleted on normal exit
Test 3: malformed stdin → .tmp still deleted by trap
  PASS: .tmp deleted even when hook errors on bad JSON

Results: 3 passed, 0 failed
```

- [x] **Step 3: Commit**

```bash
git add hooks/end-refactor-log-session-stats.sh
git commit -m "fix: always delete refactor-session.tmp via EXIT trap in Stop hook"
```

---

## <span style="color:#76a039">Task 3: Re-run install.sh</span>

The hook file is copied to `~/.claude/hooks/` by `install.sh`. Re-run it to deploy the updated script.

- [x] **Step 1: Run install**

```bash
bash install.sh
```

Expected output includes:
```
installed hook:    end-refactor-log-session-stats.sh
```

- [x] **Step 2: Verify the trap is in the installed copy**

```bash
grep "trap" ~/.claude/hooks/end-refactor-log-session-stats.sh
```

Expected:
```
trap 'rm -f "$REFACTOR_LOG_AWAITING_TOKEN_COUNT"' EXIT
```
