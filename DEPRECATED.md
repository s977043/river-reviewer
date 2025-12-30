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

- **Migration Guide:** [docs/migration/runners-architecture-guide.md](docs/migration/runners-architecture-guide.md)
- **Architecture Documentation:** [docs/architecture.md](docs/architecture.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)

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

1. Check the [Migration Guide](docs/migration/runners-architecture-guide.md)
2. Review [Epic #242](https://github.com/s977043/river-reviewer/issues/242)
3. Open an issue with the `migration-help` label
