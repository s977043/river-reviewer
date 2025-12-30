# Changelog

## v0.2.0—TBD

### Features

- **Runners Architecture Refactoring:** Separated skills (product) from execution environments (adapters)
- Added `runners/core/` with skill loader and execution planning components
- Added `runners/cli/` with command-line interface for local review execution
- Added `runners/node-api/` with programmatic TypeScript API for integrations
- Moved GitHub Action from `.github/actions/river-reviewer/` to `runners/github-action/`

### Breaking Changes

⚠️ **Important:** This release contains breaking changes. See [Migration Guide](docs/migration/runners-migration-guide.md) for upgrade instructions.

1. **GitHub Action Path Changed:**
   - **Old (v0.1.x):** `s977043/river-reviewer/.github/actions/river-reviewer@v0.1.1`
   - **New (v0.2.0+):** `s977043/river-reviewer/runners/github-action@v0.2.0`
   - **Migration:** Update all workflow files to use the new path
   - **Compatibility:** v0.1.1 continues to work with old path, but won't receive new features

2. **Core Module Imports Changed (Contributors Only):**
   - **Old:** `import { loadSkills } from './src/lib/skill-loader.mjs'`
   - **New:** `import { loadSkills } from './runners/core/skill-loader.mjs'`
   - **Impact:** Only affects direct imports of core modules (rare)

### Migration Resources

- **Full Migration Guide:** [docs/migration/runners-migration-guide.md](docs/migration/runners-migration-guide.md)
- **Deprecation Notice:** [DEPRECATED.md](DEPRECATED.md)
- **Architecture Overview:** [docs/architecture.md](docs/architecture.md)

### Documentation

- Updated all examples to use new `runners/github-action` path
- Added comprehensive migration documentation
- Updated README and tutorials with new architecture references

### Related Issues

- Epic #242: Runners Architecture Refactoring
- #243: Create runners/ directory structure
- #244: Move GitHub Action
- #245: Update all workflow and documentation references
- #246: Create CLI runner interface
- #247: Create Node API runner interface
- #240: Add backward compatibility documentation
- #241: Fix LICENSE standardization

## v0.1.1—2025-12-13

- Fixed the composite GitHub Action to work reliably when used from external repositories (installing dependencies from the action repo root).
- Added idempotent PR comment posting (updates an existing River Reviewer comment instead of duplicating).
- Added a minimal always-on "Hello Skill" to guarantee end-to-end behavior on any diff.
- Aligned milestone title formatting with `.github/workflows/auto-milestone.yml` and adjusted dash normalization logic accordingly.
- Updated CLI output for PR comments and tuned prompts to prefer Japanese review messages.

## v0.1.0—2025-12-12

- Added JSON Schema 2020-12 output format with `issues` array and `summary` aggregation (breaking for consumers of the old flat schema).
- Added upstream/midstream/downstream sample skills with YAML frontmatter.
- Added local CLI (`river run`) with diff optimization, cost estimation, and dry-run fallback behavior.
- Added composite GitHub Action (`runners/github-action`) and refreshed README/tutorial examples.
- Added the Riverbed Memory design draft under `pages/explanation/`.
- Added additional downstream and midstream skills (coverage gaps, flaky tests, test existence, TypeScript null safety).

### Breaking changes

- `schemas/output.schema.json` now returns an array of issues plus a summary object. Any tools/CI consuming the previous structure must update.

### Release checklist

- [ ] `main` の更新後、Release PR（release-please）が作成されていることを確認する。
- [ ] Release PR をマージしてリリースを確定する（タグ発行と GitHub Release は CI が実施）。
- [ ] `v0` のようなエイリアスタグは CI が最新リリースへ追従させる。
