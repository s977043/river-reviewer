# Release Smoke Runbook

Minimal post-publish checks to run after every River Review release. This is **not** a release runbook (release-please handles tagging and the GitHub Release itself); it is the **smoke test that confirms the released artifacts behave for an adopter**.

This was added as Codex's final-pass review item #3 (after the v0.51.0–v0.55.0 sprint, 2026-05-24). The goal is for the next person to run, not to read.

## When to run

- Immediately after a release-please PR merges to `main` and the `v0.x.y` tag is published.
- Before announcing the release to adopters / writing release notes.
- Whenever a dependabot bump touches a production runtime dependency.

## What this verifies

| Check                                | Confirms                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Lint / tests / skills validate       | Regression on `main` itself (catches a bad merge or stale dist)                                           |
| `node ./src/cli.mjs run . --dry-run` | The published CLI still parses, loads skills, and walks `git merge-base` against `main`                   |
| `npm pack --dry-run`                 | The tarball still respects the `files` allowlist (once #800 B2 lands) and stays in the expected size band |
| `npm audit --omit=dev`               | No new production vulnerability slipped in                                                                |
| Active GitHub Release                | The tag actually has a published Release attached (release-please can fail this step silently)            |

## Smoke sequence

Run from a clean checkout of the tagged commit. The tag is resolved from the upstream GitHub Release rather than the local `package.json` so a stale local `main` cannot point the smoke at the wrong commit:

```bash
git fetch --tags origin
TAG=$(gh release view --json tagName --jq .tagName)
git checkout "$TAG"
npm ci
npm run lint
npm test
npm run skills:validate
npm run agent-skills:validate
node ./src/cli.mjs run . --dry-run
npm pack --dry-run | tail -10
npm audit --omit=dev
```

Each step must exit `0`. Expected signals:

- `npm test`: total tests > 1000, fail 0.
- `node ./src/cli.mjs run . --dry-run`: "No changes to review compared to main." (or the local diff summary if you are sampling against a feature branch). No skill loader error.
- `npm pack --dry-run`: `total files` and `package size` line ~~unchanged~~ within the expected range (see `docs/development/npm-distribution-design.md` for the post-B2 expected sizes).
- `npm audit --omit=dev`: `found 0 vulnerabilities` (production tree only).

## Release confirmation via gh

After the smoke sequence is green, confirm the GitHub Release artifacts:

```bash
TAG="v$(node -p 'require("./package.json").version')"
gh release view "$TAG" --json tagName,name,publishedAt,assets
gh api repos/s977043/river-review/releases/tags/"$TAG" --jq '.body | .[0:400]'
```

The `tagName` / `publishedAt` should be present (not `404 Not Found`). The release body should include the changelog block release-please assembled.

## When the smoke fails

- **`npm ci` errors**: lockfile drift. Re-run `npm install` on `main` and open a PR to commit the new `package-lock.json`. The release tag itself is fine—the consumer error is the lockfile.
- **`Action dist freshness` mismatch (post-merge CI)**: someone forgot `npm run build:action` after editing `src/`. Open a small follow-up PR with the rebuilt `runners/github-action/dist/`. See `docs/development/dist-check-rebuild-guide.md`.
- **`npm audit --omit=dev` returns vulnerabilities**: open `npm audit fix --omit=dev` PR (see PR #888 for the pattern).
- **`gh release view` 404**: release-please workflow may have raced. Re-run `gh workflow run release-please.yml` against `main`, then re-check. If that fails, advance the `release-please--...` branch by one empty commit via the gh REST API (the pattern is documented in [`AGENT_LEARNINGS.md`](../../AGENT_LEARNINGS.md) under the 2026-05-24 entry).
- **`river run` skill loader error**: a skill metadata change slipped past `npm run skills:validate` (rare). Bisect with the `metadata.id` mentioned in the error.

## Out of scope

- Cross-platform install testing (Node 20 / 22 × macOS / Linux / Windows). Defer to #800 B2 acceptance.
- `npx river try` quick-start dogfooding. Defer to C3.
- Real LLM call against `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`. Defer to A2-2.
- Vercel preview verification. Out-of-band (Vercel handles its own deploy status).

## Related

- [`docs/development/npm-distribution-design.md`](../development/npm-distribution-design.md)—what the `npm pack --dry-run` numbers should look like once #800 B2 lands.
- [`docs/development/dist-check-rebuild-guide.md`](../development/dist-check-rebuild-guide.md)—how to handle Action dist staleness.
- [`docs/runbook/dev.md`](./dev.md)—the development runbook (this file's sibling).
- [`AGENT_LEARNINGS.md`](../../AGENT_LEARNINGS.md)—recovery patterns, including the gh-api empty-commit one for stuck release-please PRs.
