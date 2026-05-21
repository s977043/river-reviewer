# Deprecated Paths and Features

This document lists deprecated paths, features, and APIs in River Reviewer, along with their replacements and removal timelines.

## Architecture Refactoring (v0.2.0)

### `.github/actions/river-reviewer` → `runners/github-action`

**Deprecated in:** v0.2.0
**Removed in:** v0.2.0 (Breaking Change)

The GitHub Action has been moved from `.github/actions/river-reviewer/` to `runners/github-action/` to align with the "Skills as First-Class Assets" philosophy.

#### Migration

**Before (no longer works):**

```yaml
- uses: s977043/river-reviewer/.github/actions/river-reviewer@v0.1.1
  with:
    phase: midstream
```

**After (v0.2.0+):**

```yaml
- uses: s977043/river-reviewer/runners/github-action@v0.2.0
  with:
    phase: midstream
```

#### For Published Action Users

If you were using the action from external repositories with the old path:

```yaml
# Old path (v0.1.x)
uses: s977043/river-reviewer/.github/actions/river-reviewer@v0.1.1

# New path (v0.2.0+)
uses: s977043/river-reviewer/runners/github-action@v0.2.0
```

**Note:** Version v0.1.1 and earlier will continue to work with the old path. To use v0.2.0 and later, update to the new path.

### `src/lib/` imports → `runners/core/` imports

**Deprecated in:** v0.2.0
**Removed in:** v0.2.0 (Breaking Change)

Core skill loading and execution components have been moved from `src/lib/` to `runners/core/`.

#### Migration for Contributors

**Before:**

```javascript
import { loadSkills } from '../src/lib/skill-loader.mjs';
import { buildExecutionPlan } from '../src/lib/review-runner.mjs';
```

**After:**

```javascript
import { loadSkills } from '../runners/core/skill-loader.mjs';
import { buildExecutionPlan } from '../runners/core/review-runner.mjs';
```

## Migration Resources

- **Migration Guide:** [docs/migration/runners-migration-guide.md](migration/runners-migration-guide.md)
- **Architecture Documentation:** [docs/architecture.md](architecture.md)
- **Changelog:** [CHANGELOG.md](../CHANGELOG.md)

## Version Compatibility

| Your Version | Action Path                                                    | Status      |
| ------------ | -------------------------------------------------------------- | ----------- |
| v0.1.0       | `s977043/river-reviewer/.github/actions/river-reviewer@v0.1.0` | ✅ Works    |
| v0.1.1       | `s977043/river-reviewer/.github/actions/river-reviewer@v0.1.1` | ✅ Works    |
| v0.2.0+      | `s977043/river-reviewer/runners/github-action@v0.2.0`          | ✅ Required |

## Support Timeline

- **v0.1.x:** Continues to work with old path. No new releases on this version.
- **v0.2.0+:** Requires new path. All new features and fixes will be on this version.

## Questions?

If you have questions about migration, please:

1. Check the [Migration Guide](migration/runners-migration-guide.md)
2. Review [Epic #242](https://github.com/s977043/river-reviewer/issues/242)
3. Open an issue with the `migration-help` label

## Output artifact field `debug.executionDeferred` (v0.51.0)

### `artifact.debug.executionDeferred` → use `debug.execution` trace

**Deprecated in:** v0.51.0
**Planned removal:** v0.53.0

The boolean `debug.executionDeferred` flag was introduced in v0.50.0 (#802 Phase 3 A1)
to signal that `river review exec` had accepted the contract but had not yet wired
the skill execution adapter. v0.51.0 (#802 Phase 3 A2-1) actually wires the
adapter via `generateReview`, so the flag is no longer set and is being retired.

It is superseded by the `debug.execution` trace, which reports whether and how
findings were produced:

| Field                            | Meaning                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `debug.execution.skillsExecuted` | Number of skills the adapter actually invoked                                   |
| `debug.execution.findingsCount`  | Findings written to `artifact.findings`                                         |
| `debug.execution.llmUsed`        | `true` when an LLM call succeeded                                               |
| `debug.execution.llmSkipped`     | Reason string when the LLM call was skipped (e.g. `OPENAI_API_KEY ... not set`) |
| `debug.execution.heuristicsUsed` | `true` when the heuristic fallback ran                                          |

For "which skills did not run", continue to use `artifact.plan.skippedSkills`
(each entry has `id` and a `reasons` array). That field is unchanged.

#### Migration

**Before (v0.50.0 only):**

```js
if (artifact.debug?.executionDeferred) {
  console.warn('river review exec did not execute skills yet');
}
```

**After (v0.51.0+):**

```js
const exec = artifact.debug?.execution;
if (exec && !exec.llmUsed && !exec.heuristicsUsed) {
  console.warn('river review exec did not produce findings:', exec.llmSkipped);
}

const skipped = artifact.plan?.skippedSkills ?? [];
if (skipped.length > 0) {
  console.warn(
    skipped.length + ' skills skipped:',
    skipped.map((s) => ({ id: s.id, reasons: s.reasons }))
  );
}
```

`plan.skippedSkills` has been present since v0.45.0; `debug.execution` is
new in v0.51.0.

#### Related

- [Troubleshooting: skill selection](review/troubleshooting.md)
- Issue [#802](https://github.com/s977043/river-reviewer/issues/802) Phase 3 (A1 → A2-1 → A2-fix-1)
