#!/usr/bin/env bash
set -euo pipefail

if ! command -v npm >/dev/null 2>&1; then
  echo "[format] npm not found, skipping"
  exit 0
fi

if [ ! -d .git ]; then
  echo "[format] Not a git repository, skipping"
  exit 0
fi

# Get changed files (both staged and unstaged, excluding deleted)
CHANGED_FILES=$(git diff --name-only --diff-filter=ACMRTUXB HEAD 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
  echo "[format] No changed files to format"
  exit 0
fi

# Filter for supported extensions and run prettier
FILES_TO_FORMAT=$(echo "$CHANGED_FILES" | grep -E '\.(js|jsx|ts|tsx|json|md|yml|yaml|mjs)$' || true)

if [ -n "$FILES_TO_FORMAT" ]; then
  files_to_format_array=()
  while IFS= read -r file; do
    if [ -f "$file" ]; then
      files_to_format_array+=("$file")
    fi
  done <<< "$FILES_TO_FORMAT"

  if [ ${#files_to_format_array[@]} -gt 0 ]; then
    npx --no-install prettier --write "${files_to_format_array[@]}" || true
  fi
fi

echo "[format] Done"
