#!/usr/bin/env bash
# River Review — non-marketplace fallback setup for Codex CLI.
#
# Preferred install path is the Codex plugin marketplace:
#   codex plugin marketplace add s977043/river-review
# (Codex reads the same .claude-plugin/marketplace.json + .codex-plugin/plugin.json.)
#
# This script is a FALLBACK for environments that cannot use the marketplace.
# It vendors the River Review integration (AGENTS.md guidance + the full
# agent-skills directory, including each skill's references/) directly into
# your project.
#
# Usage (from your project root):
#   curl -fsSL https://raw.githubusercontent.com/s977043/river-review/main/scripts/setup-codex.sh | bash
#
# Or after cloning river-review:
#   bash scripts/setup-codex.sh [target-project-dir]
#
# Idempotent: re-running refreshes the vendored skills and the AGENTS.md
# River Review section without duplicating it.
set -euo pipefail

REPO="s977043/river-review"
REF="${RIVER_REVIEW_REF:-main}"
RAW_BASE="https://raw.githubusercontent.com/${REPO}/${REF}"
TARBALL_URL="https://codeload.github.com/${REPO}/tar.gz/refs/heads/${REF}"
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

# --- 3. Vendor the full agent-skills directory (including references/) -----
# Download a repo tarball and extract only skills/agent-skills/**, so every
# skill ships its SKILL.md AND its references/ rubric files. The skill list is
# derived from the tarball, never hardcoded.
log "vendoring river-review agent-skills (full directories)..."
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if curl -fsSL "$TARBALL_URL" -o "$TMP/river-review.tar.gz"; then
  # The tarball top-level dir is river-review-<ref>; strip it and keep only
  # the agent-skills subtree.
  mkdir -p skills/agent-skills
  tar -xzf "$TMP/river-review.tar.gz" -C "$TMP"
  SRC_DIR="$(find "$TMP" -maxdepth 4 -type d -path '*/skills/agent-skills' | head -1)"
  if [ -n "$SRC_DIR" ]; then
    # Copy the full agent-skills tree (SKILL.md + references/ + any assets).
    cp -R "$SRC_DIR/." skills/agent-skills/
    COUNT="$(find skills/agent-skills -maxdepth 1 -mindepth 1 -type d | wc -l | tr -d ' ')"
    log "vendored ${COUNT} skill(s) with references/ into skills/agent-skills/"
  else
    log "error: skills/agent-skills not found in tarball" >&2
    exit 1
  fi
else
  log "error: could not download repo tarball from ${TARBALL_URL}" >&2
  exit 1
fi

log "done."
log "Codex will read AGENTS.md and skills/agent-skills/ on its next run."
log "Add a .codex/config.toml (approval_policy, sandbox) to taste."
log "Note: the agent workflow runs the 'river' CLI — install it (npm/npx) or"
log "      use the skills directly if the CLI is not on PATH."
