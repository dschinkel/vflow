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
