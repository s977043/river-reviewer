#!/usr/bin/env bash
# Wrapper: delegates to the shared hook script at hooks/format.sh
# This file is referenced by .claude/settings.json (PostToolUse).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
exec "$REPO_ROOT/hooks/format.sh"
