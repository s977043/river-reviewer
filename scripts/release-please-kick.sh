#!/usr/bin/env bash
# Advance the release-please branch by an empty commit via the GitHub REST API.
# Use when the release-please PR is BLOCKED because required status checks were
# not registered on the auto-generated branch.
#
# Preferred path: trigger .github/workflows/release-please-kick.yml from the
# Actions UI. This script is a local fallback when network/credentials make the
# workflow path inconvenient.
#
# Usage:
#   scripts/release-please-kick.sh [branch]
#   REPO=owner/repo scripts/release-please-kick.sh [branch]

set -euo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
BRANCH="${1:-release-please--branches--main--components--river-reviewer}"

PARENT=$(gh api "repos/${REPO}/git/refs/heads/${BRANCH}" --jq '.object.sha')
TREE=$(gh api "repos/${REPO}/git/commits/${PARENT}" --jq '.tree.sha')
NEW=$(gh api "repos/${REPO}/git/commits" --method POST \
  -f message='chore: trigger CI on release-please branch' \
  -f tree="${TREE}" \
  -f "parents[]=${PARENT}" \
  --jq '.sha')
gh api -X PATCH "repos/${REPO}/git/refs/heads/${BRANCH}" -f sha="${NEW}" >/dev/null

echo "Advanced ${BRANCH}"
echo "  parent: ${PARENT}"
echo "  new:    ${NEW}"
