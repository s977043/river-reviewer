# Runners Architecture Migration Guide

This guide helps you migrate from River Reviewer v0.1.x to v0.2.0+, which introduces the new runners architecture.

> **Status (as of 2026-04):** The current release line is **v0.14.x**, distributed under `runners/github-action`. v0.1.x is a legacy frozen release that predates the runners architecture and receives no further updates. If you are still pinned to `@v0.1.x`, follow this guide to move to the latest release tag (see [README](../../README.md) for the current version).

## Overview

River Reviewer v0.2.0 refactored the codebase to clearly separate skills (the product) from execution environments (adapters). This change aligns with the "Skills as First-Class Assets" philosophy established in Epic #225.

## What Changed?

### Directory Structure

**Before (v0.1.x):**

```text
.
├── .github/actions/river-reviewer/  # GitHub Action
├── src/lib/                         # Skill loader + runner
└── skills/                          # Skill definitions
```

**After (v0.2.0+):**

```text
.
├── runners/
│   ├── core/           # Skill loader + execution planning
│   ├── github-action/  # GitHub Actions interface
│   ├── cli/            # Command-line interface
│   └── node-api/       # Programmatic API
├── src/lib/            # Other utilities
└── skills/             # Skill definitions (unchanged)
```

### Breaking Changes

1. **GitHub Action Path:** `.github/actions/river-reviewer` → `runners/github-action`
2. **Core Module Imports:** `src/lib/skill-loader.mjs` → `runners/core/skill-loader.mjs`

## Migration Steps

### For GitHub Actions Users

#### Step 1: Identify Your Current Version

Check your workflow files (`.github/workflows/*.yml`):

```yaml
# Find this line in your workflows
uses: s977043/river-reviewer/.github/actions/river-reviewer@v0.1.1
```

#### Step 2: Update the Action Path

**Before (v0.1.x):**

```yaml
name: River Reviewer
on:
  pull_request:
    branches: [main]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: s977043/river-reviewer/.github/actions/river-reviewer@v0.1.1
        with:
          phase: midstream
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

**After (v0.2.0+):**

```yaml
name: River Reviewer
on:
  pull_request:
    branches: [main]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: s977043/river-reviewer/runners/github-action@v0.2.0
        with:
          phase: midstream
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

#### Step 3: Test the Migration

1. Create a test PR or trigger your workflow
2. Verify the River Reviewer action runs successfully
3. Check that PR comments are posted correctly

### For Local Development (Contributors)

#### Step 1: Update Import Paths

If you're importing core modules directly, update the paths:

**Before:**

```javascript
import { loadSkills } from './src/lib/skill-loader.mjs';
import { buildExecutionPlan } from './src/lib/review-runner.mjs';
```

**After:**

```javascript
import { loadSkills } from './runners/core/skill-loader.mjs';
import { buildExecutionPlan } from './runners/core/review-runner.mjs';
```

#### Step 2: Update Test Files

If you have custom tests that import core modules:

**Before:**

```javascript
import { loadSkills } from '../src/lib/skill-loader.mjs';
```

**After:**

```javascript
import { loadSkills } from '../runners/core/skill-loader.mjs';
```

#### Step 3: Run Tests

```bash
npm test
```

All tests should pass. If you encounter import errors, check that all paths have been updated.

### For Node API Users (Future)

The new `runners/node-api/` provides a programmatic interface. Example usage:

```javascript
import { review, loadSkills } from '@river-reviewer/node-api';

// Load skills for a specific phase
const skills = await loadSkills({ phase: 'midstream' });

// Run a review
const result = await review({
  phase: 'midstream',
  files: ['src/index.ts'],
  baseBranch: 'main',
});

console.log(result.findings);
```

## Common Migration Scenarios

### Scenario 1: External Repository Using Published Action

**Task:** Update workflow in your project that uses River Reviewer

**Solution:**

1. Locate `.github/workflows/` in your repository
2. Find files using `s977043/river-reviewer/.github/actions/river-reviewer`
3. Replace with `s977043/river-reviewer/runners/github-action@v0.2.0`
4. Commit and push

### Scenario 2: Fork with Custom Modifications

**Task:** Update a forked version of River Reviewer

**Solution:**

1. Pull latest changes from upstream
2. Resolve conflicts in moved files
3. Update any custom scripts/tests that import from `src/lib/`
4. Run `npm test` to verify
5. Update your workflows to use new paths

### Scenario 3: Monorepo with Multiple Workflows

**Task:** Update multiple workflow files at once

**Solution:**

```bash
# Find all workflows using the old path
grep -r "s977043/river-reviewer/.github/actions/river-reviewer" .github/workflows/

# Use sed to replace (macOS/Linux)
find .github/workflows -name "*.yml" -exec sed -i 's|s977043/river-reviewer/.github/actions/river-reviewer|s977043/river-reviewer/runners/github-action|g' {} +

# Verify changes
git diff .github/workflows/

# Commit
git add .github/workflows/
git commit -m "chore: migrate to runners/github-action path"
```

## Rollback Plan

If you encounter issues after migration:

### Temporary Rollback

Pin to v0.1.1 with the old path until you can debug:

```yaml
- uses: s977043/river-reviewer/.github/actions/river-reviewer@v0.1.1
  with:
    phase: midstream
```

### Report Issues

If migration causes problems:

1. Open an issue: [New Issue](https://github.com/s977043/river-reviewer/issues/new)
2. Use label: `migration-help`
3. Include:
   - Your workflow file
   - Error messages
   - River Reviewer version (before/after)

## FAQ

### Q: Do I need to migrate immediately?

**A:** Yes—v0.1.x is a frozen legacy release and is no longer maintained as of the v0.12 line. While the v0.1.1 tag still resolves and the action _may_ continue to execute, no further fixes (including security fixes) are being shipped against it. Migrate to the current release tag at your earliest opportunity. See [README](../../README.md) for the latest tag.

What you miss while staying on v0.1.x:

- All features and fixes shipped in v0.2.0–v0.14.x (planner / Riverbed Memory v1 / Agent Skills bridge / Codex CLI integration / etc.)
- New interfaces (CLI runner, Node API)
- Compatibility with current schemas (`skills/`, `schemas/`)

### Q: Will my existing skills break?

**A:** No. Skill definitions (`skills/`) are unchanged. The migration only affects:

- GitHub Action path in workflows
- Import paths for core modules (contributors only)

### Q: Can I use both versions simultaneously?

**A:** Not recommended. Mixing versions causes confusion and v0.1.x is unmaintained. Pin every workflow to the current release tag (see [README](../../README.md)) under the `runners/github-action` path.

### Q: What if I have custom forks?

**A:** Update your fork to:

1. Move `.github/actions/river-reviewer/` to `runners/github-action/`
2. Move `src/lib/skill-loader.mjs` and `src/lib/review-runner.mjs` to `runners/core/`
3. Update all import paths in tests and source files
4. Update documentation

See [Epic #242](https://github.com/s977043/river-reviewer/issues/242) for implementation details.

### Q: How do I know if migration succeeded?

**A:** After updating your workflow:

1. GitHub Actions run successfully
2. PR comments appear as expected
3. No import/path errors in logs
4. `npm test` passes (for contributors)

## Timeline

| Date       | Event                                                                |
| ---------- | -------------------------------------------------------------------- |
| 2025-12-29 | v0.2.0 released with new paths                                       |
| 2026-01-29 | Migration recommended (1 month)                                      |
| 2026-02-28 | Migration encouraged (2 months)                                      |
| 2026-04    | v0.14.x is the current release line; v0.1.x is unmaintained (frozen) |
| TBD        | v0.1.x tags may eventually be removed (v1.0.0+)                      |

All feature and fix development happens on the current release line. v0.1.x receives no further updates.

## Additional Resources

- **DEPRECATED.md:** [Full deprecation notice](../deprecated.md)
- **Epic #242:** [Architecture Refactoring Details](https://github.com/s977043/river-reviewer/issues/242)
- **Architecture Docs:** [docs/architecture.md](../architecture.md)
- **Skills Concepts:** [Skills](../../pages/explanation/skills.en.md)

## Getting Help

Still stuck? Here's how to get help:

1. **Check Examples:**
   - [examples/example-1-hello-skill](../../examples/example-1-hello-skill/.github/workflows/river-reviewer.yml)
   - [examples/example-2-upstream-only](../../examples/example-2-upstream-only/.github/workflows/river-reviewer.yml)

2. **Search Issues:**
   - [Open Issues](https://github.com/s977043/river-reviewer/issues)
   - Filter by `migration-help` label

3. **Create New Issue:**
   - Template: Bug Report or Question
   - Include: workflow file, error logs, versions

4. **Ask Questions:**
   - [GitHub Issues](https://github.com/s977043/river-reviewer/issues)
   - Labels: `question`, `migration`

We're here to help make your migration smooth! 🚀
