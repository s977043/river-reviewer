# `risk-map.yaml` Example

Copy `risk-map.yaml` from this directory to `.river/risk-map.yaml` in your repository to give River Reviewer a per-path risk classification.

## What it does

`.river/risk-map.yaml` lets you mark which file paths require stricter review action. The reviewer reads each changed file in the PR, walks the rules top-to-bottom, and applies the first matching rule's `action`. The `defaults.action` covers everything that misses every rule.

Three `action` values are supported (see [`schemas/risk-map.schema.json`](../../schemas/risk-map.schema.json)):

| Action                 | Meaning                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `comment_only`         | The default light gating. Findings are reported; nothing else.                                                                 |
| `escalate`             | Findings get a severity-floor bump so they cannot land as `info` / `minor`. PR comment summary emphasises the escalated files. |
| `require_human_review` | The PR comment summary marks the path as "human review required"; CI workflows can read this to gate auto-merge.               |

## How to apply

1. Copy `examples/risk-map/risk-map.yaml` to `.river/risk-map.yaml` at your repo root.
2. Edit the rules: add patterns that match your security-sensitive files; remove the example patterns that do not apply.
3. Commit. The next `river review exec` run picks it up automatically via `runReviewPlan`'s `loadRiskMap` (#877 wired this through on the exec path).
4. To verify the file parses cleanly, run any `river review` command — a malformed file surfaces as `ReviewPlanError: Failed to load risk map: ...` with exit code 3. When the file loads successfully, the rules become part of the LLM prompt context for severity-floor escalation and human-review gating; the per-rule classification is **not** echoed back on the artifact `plan` object (the schema's `plan` only carries `selectedSkills` / `skippedSkills` / `plannerMode`).

## Backward compatibility

The risk-map file is **optional**. When `.river/risk-map.yaml` is missing, `loadRiskMap` returns `null` and `buildExecutionPlan` falls through to the default `comment_only` behaviour. There is no upgrade path forcing you to introduce the file.

## Related

- [Schema](../../schemas/risk-map.schema.json)
- [User guide: `.river/risk-map.yaml`](../../pages/guides/repo-wide-review.md)
- [Execution context contract](../../docs/development/execution-context-contract.md) — where the plan layer reads the risk map.
- PR [#877](https://github.com/s977043/river-reviewer/pull/877) — `riskAssessment` propagation on the exec path.
