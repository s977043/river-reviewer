# Release Please Kick Runbook

## When to use

The release-please PR is BLOCKED because required status checks were not
registered on the auto-generated branch (a common consequence of strict
branch protection on freshly created refs).

## Setup (one-time): `RELEASE_KICK_PAT` secret

The workflow requires a Personal Access Token to actually unblock downstream CI.
GitHub blocks `GITHUB_TOKEN`-authored pushes from triggering `pull_request: synchronize`
workflows (no-recursion safety), so the default token cannot do this job (#906).

1. Create a fine-grained PAT with **Contents: Read and write** on this repo.
   (Or use a GitHub App installation token if you prefer.)
2. Add it as repo secret `RELEASE_KICK_PAT` under **Settings → Secrets and variables → Actions**.
3. The workflow auto-detects the secret. Without it, the workflow exits 1 with a clear error
   pointing back to this runbook.

## Preferred: `workflow_dispatch`

1. Confirm `RELEASE_KICK_PAT` secret is configured (above).
2. Go to **Actions → Release Please Kick → Run workflow**.
3. Leave `branch` blank—the workflow auto-detects the open release-please PR.
4. The workflow also verifies a non-Vercel check started within 90s; if not, it fails loudly
   so the silent #906 failure mode cannot recur.

## Fallback: local script

```bash
scripts/release-please-kick.sh
# or with explicit branch:
scripts/release-please-kick.sh release-please--branches--main--components--river-review
```

The script uses `gh api` to create an empty commit via the REST API
(`POST git/commits` + `PATCH git/refs/heads/...`). It works without a clean
local checkout, which is useful during `fs-loss` incidents.

## Background

See `docs/development/retrospectives/2026-05-21-25.md` (W1+W5). The empty-commit
pattern is recorded in `AGENT_LEARNINGS.md` (2026-05-24 entry).
