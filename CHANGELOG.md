# Changelog

## [0.6.1](https://github.com/s977043/river-reviewer/compare/v0.6.0...v0.6.1) (2026-01-05)


### Bug Fixes

* address CI lint errors (MD012, MD004) and review feedback (security, robustness) ([7c52477](https://github.com/s977043/river-reviewer/commit/7c5247762b20bb4b941c884c4416e246f6c274ca))

## [0.6.0](https://github.com/s977043/river-reviewer/compare/v0.5.0...v0.6.0) (2026-01-04)

### Features

- add Claude Code best practices (hooks, commands, enhanced CLAUDE.md) ([#290](https://github.com/s977043/river-reviewer/issues/290)) ([feb3879](https://github.com/s977043/river-reviewer/commit/feb3879d6496fe5dec8b89c99d105b43a7ed7451))

## [0.5.0](https://github.com/s977043/river-reviewer/compare/v0.4.0...v0.5.0) (2025-12-30)

### Features

- **skills:** add security-privacy-design skill ([#264](https://github.com/s977043/river-reviewer/issues/264)) ([e9edfef](https://github.com/s977043/river-reviewer/commit/e9edfefd5dd2441985c7899fdc7a15410921691a))

## [0.4.0](https://github.com/s977043/river-reviewer/compare/v0.3.0...v0.4.0) (2025-12-30)

### Features

- **skills:** add architecture-validation-plan skill ([#260](https://github.com/s977043/river-reviewer/issues/260)) ([b959c56](https://github.com/s977043/river-reviewer/commit/b959c56d60207e5b0e24ebe663b6eb4d6999dca9))
- **skills:** add cache-strategy-consistency skill ([#262](https://github.com/s977043/river-reviewer/issues/262)) ([99b336c](https://github.com/s977043/river-reviewer/commit/99b336c13e4310c179ada9b35bdcf143ccc71fc0))
- **skills:** add multitenancy-isolation skill ([#261](https://github.com/s977043/river-reviewer/issues/261)) ([685280b](https://github.com/s977043/river-reviewer/commit/685280b41fff3671f8cb6dd8f0b83db6db6fbeef))

## [0.3.0](https://github.com/s977043/river-reviewer/compare/v0.2.0...v0.3.0) (2025-12-30)

- add comprehensive link checking system with security validation ([#256](https://github.com/s977043/river-reviewer/issues/256)) ([718e3ff](https://github.com/s977043/river-reviewer/commit/718e3ff32c3d662615f5cf7331096fa416dc88bf))
- add skill-eval CI workflow and migrate logging-observability skill ([#259](https://github.com/s977043/river-reviewer/issues/259)) ([f4ea416](https://github.com/s977043/river-reviewer/commit/f4ea4163947b35a3d62ca894b37d144eb5fd24b7))

## v0.2.0—2025-12-29

### Runners Architecture

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

- `main` の更新後、Release PR（release-please）が作成されていることを確認する。
- Release PR をマージしてリリースを確定する（タグ発行と GitHub Release は CI が実施）。
- `v0` のようなエイリアスタグは CI が最新リリースへ追従させる。
