#!/usr/bin/env bash
# Fires at the end of every Claude Code session (Stop hook).
# If the session was a /refactor run, sums all token counts from the session
# JSONL and writes the total into the refactor log's "Total Tokens:" line.
# Exits silently (0) for all non-refactor sessions.

set -euo pipefail

REFACTOR_LOG_AWAITING_TOKEN_COUNT="$HOME/.claude/refactor-session.tmp"

# Always remove the state file on exit — clean, errored, or signalled.
# Prevents stale .tmp files from making the hook fire visibly in future sessions.
trap 'rm -f "$REFACTOR_LOG_AWAITING_TOKEN_COUNT"' EXIT

read_refactor_session() {
  cat
}

refactor_session_is_active() {
  [ -f "$REFACTOR_LOG_AWAITING_TOKEN_COUNT" ]
}

claim_refactor_log() {
  local path
  path=$(cat "$REFACTOR_LOG_AWAITING_TOKEN_COUNT")
  rm -f "$REFACTOR_LOG_AWAITING_TOKEN_COUNT"
  echo "$path"
}

locate_session_file() {
  local session_id="$1"
  local project_key
  project_key=$(pwd | sed 's|/|-|g')
  echo "$HOME/.claude/projects/$project_key/$session_id.jsonl"
}

sum_tokens_in() {
  local session_file="$1"
  jq -r '.message.usage | select(.) |
    (.input_tokens // 0) +
    (.cache_creation_input_tokens // 0) +
    (.cache_read_input_tokens // 0) +
    (.output_tokens // 0)' "$session_file" \
    | awk '{s+=$1} END{print s+0}'
}

record_token_total() {
  local total_tokens="$1"
  local refactor_log="$2"
  sed -i '' "s|^Total Tokens: —|Total Tokens: $total_tokens|" "$refactor_log" 2>/dev/null || true
}

main() {
  local refactor_session
  refactor_session=$(read_refactor_session)
  local refactor_session_id
  refactor_session_id=$(echo "$refactor_session" | jq -r '.session_id // empty')

  refactor_session_is_active || exit 0

  local refactor_log
  refactor_log=$(claim_refactor_log)
  [ -n "$refactor_log" ] && [ -f "$refactor_log" ] || exit 0

  local refactor_session_file
  refactor_session_file=$(locate_session_file "$refactor_session_id")
  [ -f "$refactor_session_file" ] || exit 0

  local total_tokens
  total_tokens=$(sum_tokens_in "$refactor_session_file")

  record_token_total "$total_tokens" "$refactor_log"
}

main
