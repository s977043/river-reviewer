#!/usr/bin/env bash
# River Review — one-command setup for Codex CLI.
#
# Codex has no plugin marketplace, so this script vendors the River Review
# integration (AGENTS.md guidance + agent-skills) directly into your project.
# It is the Codex equivalent of `/plugin install` in Claude Code.
#
# Usage (from your project root):
#   curl -fsSL https://raw.githubusercontent.com/s977043/river-review/main/scripts/setup-codex.sh | bash
#
# Or after cloning river-review:
#   bash scripts/setup-codex.sh [target-project-dir]
#
# Idempotent: re-running updates the vendored skills and refreshes the
# AGENTS.md River Review section without duplicating it.
set -euo pipefail

REPO="s977043/river-review"
REF="${RIVER_REVIEW_REF:-main}"
RAW_BASE="https://raw.githubusercontent.com/${REPO}/${REF}"
TARGET_DIR="${1:-$(pwd)}"
MARKER_BEGIN="<!-- river-review:begin -->"
MARKER_END="<!-- river-review:end -->"

log() { printf '[river-review:setup] %s\n' "$1"; }

cd "$TARGET_DIR" || { echo "error: cannot cd into $TARGET_DIR" >&2; exit 1; }

# --- 1. Fetch the AGENTS.md River Review section --------------------------
log "fetching River Review AGENTS.md guidance..."
AGENTS_SECTION="$(curl -fsSL "${RAW_BASE}/templates/agent-workflow/codex/AGENTS.md")"

# --- 2. Install / merge AGENTS.md -----------------------------------------
WRAPPED="${MARKER_BEGIN}
${AGENTS_SECTION}
${MARKER_END}"

if [ ! -f AGENTS.md ]; then
  printf '%s\n' "$WRAPPED" > AGENTS.md
  log "created AGENTS.md"
elif grep -qF "$MARKER_BEGIN" AGENTS.md; then
  # Replace the existing river-review block in place.
  python3 - "$AGENTS_SECTION" <<'PY'
import re, sys
section = sys.argv[1]
begin, end = "<!-- river-review:begin -->", "<!-- river-review:end -->"
block = f"{begin}\n{section}\n{end}"
with open("AGENTS.md") as f:
    text = f.read()
text = re.sub(re.escape(begin) + r".*?" + re.escape(end), block, text, flags=re.DOTALL)
with open("AGENTS.md", "w") as f:
    f.write(text)
PY
  log "refreshed River Review section in existing AGENTS.md"
else
  printf '\n\n%s\n' "$WRAPPED" >> AGENTS.md
  log "appended River Review section to existing AGENTS.md"
fi

# --- 3. Vendor the agent-skills via sparse git archive --------------------
log "vendoring river-review agent-skills..."
SKILLS=(adversarial-review river-review river-review-architecture \
  river-review-code river-review-performance river-review-security \
  river-review-testing)

mkdir -p skills/agent-skills
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Download each skill's SKILL.md (and references/) from raw GitHub.
for skill in "${SKILLS[@]}"; do
  mkdir -p "skills/agent-skills/${skill}"
  if curl -fsSL "${RAW_BASE}/skills/agent-skills/${skill}/SKILL.md" \
      -o "skills/agent-skills/${skill}/SKILL.md" 2>/dev/null; then
    :
  else
    log "warning: could not fetch ${skill}/SKILL.md (skipped)"
  fi
done

log "done."
log "Codex will read AGENTS.md and skills/agent-skills/ on its next run."
log "Add a .codex/config.toml (approval_policy, sandbox) to taste."
