#!/usr/bin/env bash
set -euo pipefail

# Post-edit hook: format changed files
# Runs after Claude writes/edits files

if ! command -v npm >/dev/null 2>&1; then
  echo "[format] npm not found, skipping"
  exit 0
fi

# Format only staged/changed files for speed
CHANGED_FILES=$(git diff --name-only --cached 2>/dev/null || git diff --name-only 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
  echo "[format] No changed files to format"
  exit 0
fi

# Run prettier on changed files that match our patterns
echo "$CHANGED_FILES" | grep -E '\.(js|jsx|ts|tsx|json|md|yml|yaml)$' | xargs -r npx prettier --write 2>/dev/null || true

echo "[format] Done"
