#!/usr/bin/env bash
# Fires at the start of a /refactor skill session (UserPromptSubmit).
# Blocks if the context window doesn't meet the threshold required for a full refactor session.
# Sonnet requires 90% remaining; Opus requires 80% remaining.
# Exits silently (0) for all non-refactor prompts or fresh sessions.

set -euo pipefail

STDIN_JSON=$(cat)

prompt=$(echo "$STDIN_JSON" | jq -r '.prompt // ""')
session_id=$(echo "$STDIN_JSON" | jq -r '.session_id // ""')

# Only gate /refactor invocations
[[ "$prompt" =~ ^/refactor ]] || exit 0

# Locate session JSONL — fresh sessions won't have one yet (allow)
project_key=$(pwd | sed 's|/|-|g')
session_file="$HOME/.claude/projects/$project_key/$session_id.jsonl"
[ -f "$session_file" ] || exit 0

# Most recent turn's total input tokens — best proxy for current context usage
recent_input=$(jq -s '[.[] | select(.message.usage != null) | .message.usage | (.input_tokens // 0) + (.cache_creation_input_tokens // 0) + (.cache_read_input_tokens // 0)] | last // 0' "$session_file" 2>/dev/null || echo 0)
[ "$recent_input" -gt 0 ] || exit 0

# Detect model from global settings; default to Sonnet thresholds if unknown
model=$(jq -r '.model // ""' "$HOME/.claude/settings.json" 2>/dev/null || echo "")

context_window=200000

if [[ "$model" =~ opus ]]; then
  min_remaining_percent=80
else
  min_remaining_percent=90
fi

max_tokens_used=$(( context_window * (100 - min_remaining_percent) / 100 ))

if [ "$recent_input" -gt "$max_tokens_used" ]; then
  used_percent=$(( recent_input * 100 / context_window ))
  remaining_percent=$(( 100 - used_percent ))
  model_label="${model:-sonnet}"
  jq -n \
    --argjson required "$min_remaining_percent" \
    --arg model "$model_label" \
    --argjson remaining_pct "$remaining_percent" \
    --argjson used_tok "$recent_input" \
    --argjson window "$context_window" \
    '{"continue":false,"stopReason":("/refactor requires at least " + ($required|tostring) + "% context remaining (" + $model + "). Only ~" + ($remaining_pct|tostring) + "% remains (" + ($used_tok|tostring) + " of " + ($window|tostring) + " tokens used). Please start a new Claude Code session.")}'
fi
