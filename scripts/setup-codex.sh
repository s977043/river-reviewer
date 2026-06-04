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
# Pin a branch, tag, or commit with RIVER_REVIEW_REF (default: main):
#   RIVER_REVIEW_REF=v1.2.1 bash scripts/setup-codex.sh [target-project-dir]
#
# Idempotent: re-running refreshes the vendored skills and the AGENTS.md
# River Review section without duplicating it.
set -euo pipefail

REPO="s977043/river-review"
REF="${RIVER_REVIEW_REF:-main}"
RAW_BASE="https://raw.githubusercontent.com/${REPO}/${REF}"
TARGET_DIR="${1:-$(pwd)}"
MARKER_BEGIN="<!-- river-review:begin -->"
MARKER_END="<!-- river-review:end -->"

log() { printf '[river-review:setup] %s\n' "$1"; }

cd "$TARGET_DIR" || { echo "error: cannot cd into $TARGET_DIR" >&2; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Download the repo tarball. REF may be a branch, tag, or commit SHA, so try
# the heads/ form first and fall back to tags/ then the bare ref (SHA).
download_tarball() {
  for path in "refs/heads/${REF}" "refs/tags/${REF}" "${REF}"; do
    if curl -fsSL "https://codeload.github.com/${REPO}/tar.gz/${path}" \
        -o "$TMP/river-review.tar.gz" 2>/dev/null; then
      return 0
    fi
  done
  return 1
}

# --- 1. Fetch the AGENTS.md guidance and the skills tarball ----------------
# Do all network work and staging BEFORE mutating the target project, so a
# failed download never leaves a half-initialized project (AGENTS.md written
# but no skills, or vice versa).
log "fetching River Review AGENTS.md guidance..."
AGENTS_SECTION="$(curl -fsSL "${RAW_BASE}/templates/agent-workflow/codex/AGENTS.md")"

log "downloading river-review agent-skills (ref: ${REF})..."
if ! download_tarball; then
  log "error: could not download repo tarball for ref '${REF}'" >&2
  exit 1
fi
tar -xzf "$TMP/river-review.tar.gz" -C "$TMP"
# The tarball top-level dir is river-review-<ref>; locate the agent-skills subtree.
SRC_DIR="$(find "$TMP" -maxdepth 4 -type d -path '*/skills/agent-skills' | head -1)"
if [ -z "$SRC_DIR" ] || [ -z "$(find "$SRC_DIR" -name SKILL.md -print -quit)" ]; then
  log "error: skills/agent-skills (with SKILL.md) not found in tarball" >&2
  exit 1
fi

# --- 2. Vendor the full agent-skills directory (including references/) ------
# Replace each vendored skill directory atomically. A marker file records which
# skills we vendored last time, so skills that were renamed or removed upstream
# are cleaned up on re-run. Unrelated skills the consumer added are left intact.
log "vendoring river-review agent-skills (full directories)..."
mkdir -p skills/agent-skills
MARKER_FILE="skills/agent-skills/.river-review-vendored"

# Skills present in the freshly downloaded tarball.
NEW_NAMES="$(find "$SRC_DIR" -maxdepth 1 -mindepth 1 -type d -exec basename {} \; | sort)"

# Remove previously-vendored skills that no longer exist upstream.
if [ -f "$MARKER_FILE" ]; then
  while IFS= read -r old_name; do
    [ -z "$old_name" ] && continue
    # Only a plain directory name (no path separators, no leading dot) is a valid
    # skill name; reject anything else to avoid an rm -rf path-traversal.
    case "$old_name" in
      */* | .*) continue ;;
    esac
    if ! printf '%s\n' "$NEW_NAMES" | grep -qxF "$old_name"; then
      rm -rf "skills/agent-skills/${old_name}"
      log "removed stale vendored skill: ${old_name}"
    fi
  done < "$MARKER_FILE"
fi

VENDORED=0
while IFS= read -r skill_dir; do
  name="${skill_dir##*/}"
  rm -rf "skills/agent-skills/${name}"
  cp -R "$skill_dir" "skills/agent-skills/${name}"
  VENDORED=$((VENDORED + 1))
done < <(find "$SRC_DIR" -maxdepth 1 -mindepth 1 -type d)

# Record the vendored set for the next upgrade's stale-skill cleanup.
printf '%s\n' "$NEW_NAMES" > "$MARKER_FILE"
log "vendored ${VENDORED} skill(s) with references/ into skills/agent-skills/"

# --- 3. Install / merge AGENTS.md (last, after skills are in place) ---------
WRAPPED="${MARKER_BEGIN}
${AGENTS_SECTION}
${MARKER_END}"

if [ ! -f AGENTS.md ]; then
  printf '%s\n' "$WRAPPED" > AGENTS.md
  log "created AGENTS.md"
elif grep -qF "$MARKER_BEGIN" AGENTS.md && grep -qF "$MARKER_END" AGENTS.md; then
  # Replace the existing river-review block in place. Requires BOTH markers: if
  # only the begin marker survived (e.g. a manual edit removed the end marker),
  # the awk skip-until-end would silently drop the rest of the file, so we fall
  # through to the safe append branch instead. Uses awk (always available where
  # bash runs) so there is no python3 dependency that could leave AGENTS.md
  # un-refreshed after the skills were already vendored.
  printf '%s\n' "$WRAPPED" > "$TMP/block.md"
  awk -v blockfile="$TMP/block.md" '
    BEGIN { block = ""; while ((getline line < blockfile) > 0) block = block line "\n" }
    index($0, "<!-- river-review:begin -->") { printf "%s", block; skip = 1; next }
    index($0, "<!-- river-review:end -->")   { skip = 0; next }
    !skip { print }
  ' AGENTS.md > "$TMP/AGENTS.md.new"
  mv "$TMP/AGENTS.md.new" AGENTS.md
  log "refreshed River Review section in existing AGENTS.md"
else
  printf '\n\n%s\n' "$WRAPPED" >> AGENTS.md
  log "appended River Review section to existing AGENTS.md"
fi

log "done."
log "Codex will read AGENTS.md and skills/agent-skills/ on its next run."
log "Add a .codex/config.toml (approval_policy, sandbox) to taste."
log "Note: the agent workflow runs the 'river' CLI — install it (npm/npx) or"
log "      use the skills directly if the CLI is not on PATH."
