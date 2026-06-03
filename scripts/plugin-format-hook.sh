#!/usr/bin/env bash
# Self-contained PostToolUse format hook for the river-review plugin.
#
# Bundled inside the plugin and invoked via ${CLAUDE_PLUGIN_ROOT} in
# hooks/hooks.json, so it works when the plugin is installed into another
# project (unlike .claude/hooks/format.sh, which assumes the river-review
# repo layout).
#
# Behavior: formats the consumer project's changed files with the project's
# own prettier. Degrades gracefully (exit 0) when npm / git / prettier are
# unavailable, so it never blocks the host project.
set -euo pipefail

# Run in the consumer's project directory (set by Claude Code), falling back
# to the current working directory.
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 0

if ! command -v npm >/dev/null 2>&1; then
  echo "[river-review:format] npm not found, skipping"
  exit 0
fi

if [ ! -d .git ]; then
  echo "[river-review:format] not a git repository, skipping"
  exit 0
fi

CHANGED_FILES=$(git diff --name-only --diff-filter=ACMRTUXB HEAD 2>/dev/null || echo "")
if [ -z "$CHANGED_FILES" ]; then
  exit 0
fi

FILES_TO_FORMAT=$(echo "$CHANGED_FILES" | grep -E '\.(js|jsx|ts|tsx|json|md|yml|yaml|mjs)$' || true)
if [ -z "$FILES_TO_FORMAT" ]; then
  exit 0
fi

# Use the consumer project's prettier only (no install). If absent, skip.
if ! npx --no-install prettier --version >/dev/null 2>&1; then
  echo "[river-review:format] prettier not installed in project, skipping"
  exit 0
fi

files_array=()
while IFS= read -r file; do
  [ -f "$file" ] && files_array+=("$file")
done <<<"$FILES_TO_FORMAT"

if [ ${#files_array[@]} -gt 0 ]; then
  npx --no-install prettier --write "${files_array[@]}" || true
  echo "[river-review:format] formatted ${#files_array[@]} file(s)"
fi
