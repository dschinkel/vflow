#!/usr/bin/env bash
# Installs vflow commands and hooks into your Claude Code user directory.
#
# What it does:
#   1. Copies commands/*.md  → ~/.claude/commands/
#   2. Copies hooks/*.sh     → ~/.claude/hooks/
#   3. Merges the Stop hook  → ~/.claude/settings.json
#
# Safe to re-run — existing commands and hooks are overwritten in place,
# and the Stop hook entry is only added if not already present.

set -euo pipefail

CLAUDE_DIR="$HOME/.claude"
COMMANDS_DIR="$CLAUDE_DIR/commands"
HOOKS_DIR="$CLAUDE_DIR/hooks"
SETTINGS="$CLAUDE_DIR/settings.json"

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- commands ---
mkdir -p "$COMMANDS_DIR"
for f in "$REPO_DIR"/commands/*.md; do
  cp "$f" "$COMMANDS_DIR/"
  echo "installed command: $(basename "$f")"
done

# --- hooks ---
mkdir -p "$HOOKS_DIR"
for f in "$REPO_DIR"/hooks/*.sh; do
  cp "$f" "$HOOKS_DIR/"
  chmod +x "$HOOKS_DIR/$(basename "$f")"
  echo "installed hook:    $(basename "$f")"
done

# Create settings file if missing
if [ ! -f "$SETTINGS" ]; then
  echo '{}' > "$SETTINGS"
fi

# --- settings: merge Stop hook entry ---
STOP_HOOK_COMMAND="[ -f $HOOKS_DIR/end-refactor-log-session-stats.sh ] && bash $HOOKS_DIR/end-refactor-log-session-stats.sh || true"

if jq -e --arg cmd "$STOP_HOOK_COMMAND" \
  '.hooks.Stop[]?.hooks[]? | select(.command == $cmd)' \
  "$SETTINGS" > /dev/null 2>&1; then
  echo "Stop hook already registered in $SETTINGS — skipping"
else
  TMP=$(mktemp)
  jq --arg cmd "$STOP_HOOK_COMMAND" \
    '.hooks.Stop //= [] | .hooks.Stop += [{"hooks": [{"type": "command", "command": $cmd}]}]' \
    "$SETTINGS" > "$TMP" && mv "$TMP" "$SETTINGS"
  echo "registered Stop hook in $SETTINGS"
fi

# --- settings: merge UserPromptSubmit hook entry ---
SKILL_START_HOOK_COMMAND="bash $HOOKS_DIR/start-refactor-skill.sh"

if jq -e --arg cmd "$SKILL_START_HOOK_COMMAND" \
  '.hooks.UserPromptSubmit[]?.hooks[]? | select(.command == $cmd)' \
  "$SETTINGS" > /dev/null 2>&1; then
  echo "UserPromptSubmit hook already registered in $SETTINGS — skipping"
else
  TMP=$(mktemp)
  jq --arg cmd "$SKILL_START_HOOK_COMMAND" \
    '.hooks.UserPromptSubmit //= [] | .hooks.UserPromptSubmit += [{"hooks": [{"type": "command", "command": $cmd}]}]' \
    "$SETTINGS" > "$TMP" && mv "$TMP" "$SETTINGS"
  echo "registered UserPromptSubmit hook in $SETTINGS"
fi

# --- feature-ui ---
FEATURE_UI_SRC="$REPO_DIR/feature-ui"
FEATURE_UI_DEST="$CLAUDE_DIR/feature-ui"

if command -v pnpm >/dev/null 2>&1; then
  echo "building feature-ui..."
  pnpm --dir "$FEATURE_UI_SRC" install --silent
  pnpm --dir "$FEATURE_UI_SRC" build 2>/dev/null

  mkdir -p "$FEATURE_UI_DEST"
  cp -r "$FEATURE_UI_SRC/server"       "$FEATURE_UI_DEST/"
  cp -r "$FEATURE_UI_SRC/dist"         "$FEATURE_UI_DEST/"
  cp    "$FEATURE_UI_SRC/package.json" "$FEATURE_UI_DEST/"

  pnpm --dir "$FEATURE_UI_DEST" install --prod --silent
  echo "installed feature-ui → $FEATURE_UI_DEST"
else
  echo "warning: pnpm not found — skipping feature-ui. Install pnpm and re-run install.sh."
fi

echo ""
echo "Done. Restart Claude Code for hook changes to take effect."
