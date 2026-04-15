---
title: river review plan CLI Spec
---

`river review plan` is the River Reviewer CLI subcommand that **generates and runs a review plan** against upstream artifacts. This document defines the arguments, input artifacts, output formats, exit codes, severity buckets (fail / warn / advisory), and the machine-readable output policy.

> Related issues: #517 (Task) / #509 (Capability) / #507 (Epic)
> Prerequisite: input artifacts follow the [Artifact Input Contract](./artifact-input-contract.en.md).

## Positioning

- `river review plan` consumes artifacts produced by upstream workflows such as **PlanGate v6**, generates a review plan (skill selection / ordering), and emits the execution result as a [Review Artifact](./review-artifact.en.md).
- While `river run` is a generic local-developer entry point, `river review plan` provides a **stable contract for CI / batch execution**.
- Stability label: **Beta** (see [Stable Interfaces](./stable-interfaces.en.md)). Adding flags is a minor bump; removing or changing the meaning of flags is a major bump.

## Usage

```bash
river review plan [options]
```

### Minimal examples

```bash
# Auto-detect input artifacts from the current directory and run
river review plan

# Specify artifacts explicitly and write JSON output to a file
river review plan \
  --artifact pbi-input=./artifacts/pbi-input.md \
  --artifact plan=./artifacts/plan.md \
  --artifact diff=./artifacts/diff.patch \
  --output json \
  --output-file ./artifacts/review-artifact.json

# Generate the plan only (do not execute skills)
river review plan --plan-only --output json
```

## Arguments

### Artifact selection

| Option                   | Type       | Required | Description                                                                                                                                 |
| ------------------------ | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `--artifact <id>=<path>` | repeatable | Optional | Pair of artifact ID (defined in [Artifact Input Contract](./artifact-input-contract.en.md)) and file path. May be specified multiple times. |
| `--artifacts-dir <path>` | string     | Optional | Base directory used for default-filename auto-detection. Defaults to current working directory.                                             |
| `--config <path>`        | string     | Optional | Path to `river.config.*`. The `artifacts` section in the config is overridden by `--artifact`.                                              |

Resolution order matches Artifact Input Contract "Input Channels" (CLI args → config file → directory auto-detection).

### Plan control

| Option                 | Type    | Default     | Description                                                                                            |
| ---------------------- | ------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| `--phase <value>`      | enum    | `midstream` | One of `upstream` / `midstream` / `downstream`. Review phase.                                          |
| `--planner <value>`    | enum    | `off`       | One of `off` / `order` / `prune`. AI planner mode.                                                     |
| `--plan-only`          | flag    | false       | Generate the plan only; do not execute skills. `status` becomes `ok` and `findings` is an empty array. |
| `--include-skill <id>` | repeat. | -           | Skill ID that must be included in the plan.                                                            |
| `--exclude-skill <id>` | repeat. | -           | Skill ID to exclude from the plan.                                                                     |
| `--max-cost <usd>`     | number  | -           | If estimated cost exceeds this threshold, abort without executing and exit with code `1`.              |

### Output control

| Option                  | Type   | Default | Description                                                                                               |
| ----------------------- | ------ | ------- | --------------------------------------------------------------------------------------------------------- |
| `--output <format>`     | enum   | `text`  | One of `text` / `markdown` / `json`. `json` is the machine-readable contract (see below).                 |
| `--output-file <path>`  | string | -       | Output destination. Defaults to stdout when unset.                                                        |
| `--summary-file <path>` | string | -       | Write a human-readable summary (Markdown) to a separate file. Intended to be paired with `--output json`. |
| `--quiet`               | flag   | false   | Suppress progress logs on stdout (errors still go to stderr). For CI use.                                 |
| `--debug`               | flag   | false   | Include debug data in the [Review Artifact](./review-artifact.en.md) `debug` field.                       |

### Failure thresholds

| Option                 | Type | Default    | Description                                                                                            |
| ---------------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `--fail-on <severity>` | enum | `critical` | One of `critical` / `major` / `minor` / `info`. A finding at this severity or above counts as a fail.  |
| `--warn-on <severity>` | enum | `major`    | Threshold for warnings (below `--fail-on`).                                                            |
| `--advisory-only`      | flag | false      | Always exit with `0` regardless of severity. Findings are still reported but the run does not fail CI. |

The severity vocabulary is the same as [`schemas/output.schema.json`](../../schemas/output.schema.json) and the severity mapping in `.claude/rules/review-core.md` (`critical` / `major` / `minor` / `info`).

## Input Artifacts

`river review plan` recognizes the artifacts listed in [Artifact Input Contract](./artifact-input-contract.en.md) "Artifact Catalog" verbatim (`pbi-input` / `plan` / `todo` / `test-cases` / `review-self` / `review-external` / `diff` / `junit` / `coverage` / `lint` / `typecheck`).

- The set of artifact IDs and their formats is governed by the Artifact Input Contract, not this spec.
- When `diff` is unspecified and the `git diff` fallback is also empty, `status` becomes `no-changes` and no skills run (exit `0`).
- Failure to resolve a required artifact exits with code `1` (see below).

## Output Formats

### `--output text` (default)

Prints a human-readable summary to stdout. Format is **outside** the stable contract (may change in minor releases).

### `--output markdown`

Emits Markdown suitable for GitHub Actions PR comments. Format aligns with [Review Output Example](./review-output-example.en.md).

### `--output json` (machine-readable / stable contract)

Emits JSON conforming to [`schemas/review-artifact.schema.json`](../../schemas/review-artifact.schema.json).

- Schema version is governed by the `version` field (currently `"1"`).
- Each `findings[]` entry is compatible with the `issue` definition in `output.schema.json`.
- `debug` is included only when `--debug` is set.
- With `--plan-only`, `findings` is an empty array, `status` is `ok`, and only `plan.selectedSkills` carries meaning.

JSON output is the **single stable machine-readable contract**. Downstream pipelines (Riverbed Memory ingestion, evaluation, CI gating) should consume only this JSON.

## Severity Buckets (fail / warn / advisory)

| Bucket     | Criterion                                                                             | Default behavior                         |
| ---------- | ------------------------------------------------------------------------------------- | ---------------------------------------- |
| `fail`     | One or more findings at or above `--fail-on` severity (default `critical`).           | Exit `1`. Fails CI.                      |
| `warn`     | One or more findings below `--fail-on` but at or above `--warn-on` (default `major`). | Exit `2`. CI may choose how to treat it. |
| `advisory` | Neither of the above; only `minor` / `info` findings, or `--advisory-only` is set.    | Exit `0`. Informational only.            |

The mapping between internal severity tokens (`blocker` / `warning` / `nit`) and JSON schema tokens (`critical` / `major` / `minor` / `info`) is defined in `.claude/rules/review-core.md`. Unknown severity values fall back to `major` for safety.

## Exit Codes

| Exit | Meaning                                                                                              |
| ---- | ---------------------------------------------------------------------------------------------------- |
| `0`  | Success. `status` is `ok` / `no-changes` / `skipped-by-label`, with no fail/warn findings.           |
| `1`  | Failure. Reached `--fail-on` threshold, required artifact missing, plan/exec error, or `--max-cost`. |
| `2`  | Warn-only. `--warn-on` threshold reached but `--fail-on` not met.                                    |
| `3`  | Configuration error. Argument validation failed, config could not be loaded, etc.                    |

When `--advisory-only` is set, fail/warn judgement is disabled and only internal errors (missing artifacts, execution errors) yield non-zero exit.

## CI / Downstream Integration

- **Review Artifact**: persist `--output json --output-file <path>` via the CI artifact upload step.
- **GitHub Action**: `runners/github-action/action.yml` will map inputs onto this CLI (deferred to follow-up issue #511).
- **Riverbed Memory**: only the JSON output is canonical for ingestion (see [Riverbed Storage](./riverbed-storage.en.md)).
- **PR comments**: idempotent updates via the `<!-- river-reviewer -->` marker follow [Stable Interfaces](./stable-interfaces.en.md).

## Compatibility Policy

- The set of `--artifact` IDs grows together with the Artifact Input Contract.
- Adding flags is a minor bump; removing flags or changing their meaning / default value is a major bump.
- Exit codes (`0` / `1` / `2` / `3`) are part of the **stable contract** and require a major bump to change.
- Breaking changes in JSON output follow the versioning rules of [Review Artifact](./review-artifact.en.md).

## See Also

- [Artifact Input Contract](./artifact-input-contract.en.md) — Input artifact contract
- [Review Artifact](./review-artifact.en.md) — Output JSON schema
- [Stable Interfaces](./stable-interfaces.en.md) — CLI / GitHub Actions stable contract
- [Runner CLI Reference](./runner-cli-reference.en.md) — Runner CLI (validators) usage
- [Review Policy](./review-policy.en.md) — AI review policy
