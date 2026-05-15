#!/usr/bin/env bash
# Fired by Claude Code's Stop hook after every session.
# If the session was a /refactor run, sums all token counts from the session
# JSONL and writes the total into the session log's "Total Tokens:" line.
# Exits silently (0) for all non-refactor sessions.

set -euo pipefail

SESSION_JSON=$(cat)
SESSION_ID=$(echo "$SESSION_JSON" | jq -r '.session_id // empty')

STATE="$HOME/.claude/refactor-session.tmp"
[ -f "$STATE" ] || exit 0

LOG=$(cat "$STATE")
rm -f "$STATE"

[ -n "$LOG" ] && [ -f "$LOG" ] || exit 0

PRJ=$(pwd | sed 's|/|-|g')
SF="$HOME/.claude/projects/$PRJ/$SESSION_ID.jsonl"
[ -f "$SF" ] || exit 0

TOK=$(jq -r '.message.usage | select(.) |
  (.input_tokens // 0) +
  (.cache_creation_input_tokens // 0) +
  (.cache_read_input_tokens // 0) +
  (.output_tokens // 0)' "$SF" \
  | awk '{s+=$1} END{print s+0}')

sed -i '' "s|^Total Tokens: —|Total Tokens: $TOK|" "$LOG" 2>/dev/null || true
