# repo-wide-eval fixtures

Regression fixtures for repo-wide review. Tracks how often `collectRepoContext` improves detection on cross-file scenarios that the diff alone cannot expose.

Issue: [#688](https://github.com/s977043/river-reviewer/issues/688)

## Run

```bash
npm run eval:repo-context
node scripts/evaluate-repo-wide-fixtures.mjs --verbose
```

## Schema (`cases.json`)

```jsonc
{
  "name": "human-readable label",
  "phase": "midstream",
  "category": "i18n | normalization | loading | nullability | api-compat | guard",
  "seedRepo": "seeds/<id>/", // mock filesystem under this dir
  "diffFile": "diffs/<id>.diff", // unified diff to feed generateReview
  "planSkills": ["rr-midstream-..."], // optional: skills the planner would have selected
  "expected": {
    "withRepoContext": { "minFindings": 0 },
    "withoutRepoContext": { "minFindings": 0 },
  },
}
```

## Adding a new case

1. Drop a unified diff under `diffs/` and the minimal seed filesystem under `seeds/<id>/` (avoid `.git` — `collectRepoContext` does not require git, just `fs` access).
2. Append an entry to `cases.json` with `seedRepo`, `diffFile`, the relevant `planSkills`, and `expected.withRepoContext` / `withoutRepoContext`.
3. Run `npm run eval:repo-context` and check that `contextLiftRate` moves in the expected direction. Subsequent #688 PRs tighten the assertions.

## Why mock filesystem rather than real git repo

A real `.git` inside the fixture would conflict with the host repo's git operations. `collectRepoContext` only needs `fs.statSync` / `fs.readFileSync` / optionally `rg`, so a plain directory works. See `src/lib/repo-context.mjs` for the file-access surface.

## What this catches

- Detection coverage: should-detect cases with the canonical `planSkills`.
- Guard cases: scenarios where context is present but no finding is appropriate (`category: guard`).
- `contextLiftRate`: a positive value confirms `collectRepoContext` is meaningfully strengthening detection.
