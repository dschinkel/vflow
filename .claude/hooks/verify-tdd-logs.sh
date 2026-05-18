#!/usr/bin/env bash
# Fires on UserPromptSubmit. If a TDD session is active (.tdd-context.json exists in
# the project root), verifies that required log files have been written. Blocks the
# next prompt if either file is missing — enforcement the model cannot skip.

set -euo pipefail

TDD_CONTEXT="$PWD/.tdd-context.json"

# No active TDD session — nothing to check
[ -f "$TDD_CONTEXT" ] || exit 0

current_increment=$(jq -r '.currentIncrement // 0' "$TDD_CONTEXT" 2>/dev/null || echo 0)
log_folder=$(jq -r '.logFolder // ""' "$TDD_CONTEXT" 2>/dev/null || echo "")
sticky=$(jq -r '.sticky // "unknown"' "$TDD_CONTEXT" 2>/dev/null || echo "unknown")

# Nothing to verify until Phase 3 has started (increment >= 1)
[ "$current_increment" -ge 1 ] || exit 0
[ -n "$log_folder" ] || exit 0

plan_file="$PWD/$log_folder/tdd-plan.md"
impl_file="$PWD/$log_folder/tdd-implementation.md"

if [ ! -f "$plan_file" ]; then
  jq -n \
    --arg sticky "$sticky" \
    --arg path "$log_folder/tdd-plan.md" \
    '{"continue": false, "stopReason": ("TDD session \"" + $sticky + "\": tdd-plan.md is missing. Write it to " + $path + " before proceeding.")}'
  exit 0
fi

if [ ! -f "$impl_file" ]; then
  jq -n \
    --arg sticky "$sticky" \
    --arg path "$log_folder/tdd-implementation.md" \
    '{"continue": false, "stopReason": ("TDD session \"" + $sticky + "\": tdd-implementation.md is missing. Initialize it at " + $path + " before proceeding.")}'
  exit 0
fi

exit 0
