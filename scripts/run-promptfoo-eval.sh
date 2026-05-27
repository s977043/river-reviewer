#!/usr/bin/env bash
# Local helper to run promptfoo eval against community skill configs.
# Preferred over the GitHub Actions workflow when API keys live on the
# developer's machine rather than in repo secrets (per project policy).
#
# Requires at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY in the env.
#
# Usage:
#   scripts/run-promptfoo-eval.sh                          # all community skills
#   scripts/run-promptfoo-eval.sh <skill-filter>           # egrep filter on path
#   PROVIDER_FILTER=anthropic:... scripts/run-promptfoo-eval.sh
#
# Output: ./eval-output/<skill-id>.json per evaluated skill.
# Next step: see docs/runbook/community-skill-eval.md "Review and commit goldens".

set -euo pipefail

SKILL_FILTER="${1:-}"
PROVIDER_FILTER="${PROVIDER_FILTER:-}"

if [ -z "${OPENAI_API_KEY:-}" ] && [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "error: set OPENAI_API_KEY and/or ANTHROPIC_API_KEY before running." >&2
  echo "       see docs/runbook/community-skill-eval.md" >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "error: npx not found. Install Node.js (see .nvmrc)." >&2
  exit 1
fi

mapfile -t configs < <(find skills/midstream/community -name promptfoo.yaml -path '*/eval/*' | sort)
if [ -n "${SKILL_FILTER}" ]; then
  mapfile -t configs < <(printf '%s\n' "${configs[@]}" | grep -E "${SKILL_FILTER}" || true)
fi

if [ "${#configs[@]}" -eq 0 ]; then
  echo "error: no community skill eval configs match filter '${SKILL_FILTER}'." >&2
  exit 1
fi

mkdir -p eval-output
echo "evaluating ${#configs[@]} skill(s)..."

for config in "${configs[@]}"; do
  skill_dir="$(dirname "$(dirname "${config}")")"
  skill_id="$(basename "${skill_dir}")"
  out="eval-output/${skill_id}.json"
  echo "  → ${skill_id}"
  if [ -n "${PROVIDER_FILTER}" ]; then
    npx promptfoo eval --config "${config}" --output "${out}" --providers "${PROVIDER_FILTER}" || true
  else
    npx promptfoo eval --config "${config}" --output "${out}" || true
  fi
done

echo
echo "done. outputs in eval-output/. Next: review per docs/runbook/community-skill-eval.md."
