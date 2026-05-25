# Release Please Kick Runbook

## When to use

The release-please PR is BLOCKED because required status checks were not
registered on the auto-generated branch (a common consequence of strict
branch protection on freshly created refs).

## Preferred: `workflow_dispatch`

1. Go to **Actions → Release Please Kick → Run workflow**.
2. Leave `branch` as the default
   (`release-please--branches--main--components--river-reviewer`) unless the
   release-please component name differs.
3. Confirm the new commit appears on the branch and CI starts.

## Fallback: local script

```bash
scripts/release-please-kick.sh
# or with explicit branch:
scripts/release-please-kick.sh release-please--branches--main--components--river-reviewer
```

The script uses `gh api` to create an empty commit via the REST API
(`POST git/commits` + `PATCH git/refs/heads/...`). It works without a clean
local checkout, which is useful during `fs-loss` incidents.

## Background

See `docs/development/retrospectives/2026-05-21-25.md` (W1+W5). The empty-commit
pattern is recorded in `AGENT_LEARNINGS.md` (2026-05-24 entry).
