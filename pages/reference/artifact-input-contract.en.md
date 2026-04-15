---
title: Artifact Input Contract
---

River Reviewer is a review agent that consumes artifacts produced by upstream workflows such as PlanGate as **external inputs** and performs review, QA, and double-check operations. This document defines the input contract that River Reviewer can read stably.

> Related issues: #516 (Task) / #508 (Capability) / #507 (Epic)

## Policy

- River Reviewer operates **artifact-driven** and does not depend on PlanGate-internal commands or on a specific directory layout.
- Inputs are consumed on a **file path basis**; only the content format (Markdown / JSON / XML / plain) is contracted.
- Behavior when a file is missing (skip / degrade / error) is defined per artifact.
- When adding a new artifact, update this document and preserve backward compatibility.

## Artifact Catalog

The input artifacts recognized by River Reviewer are listed below. See "Legend" at the end for column semantics.

| ID                | Example filename     | Format       | Required        | Schema / reference                                  | Role                                                     |
| ----------------- | -------------------- | ------------ | --------------- | --------------------------------------------------- | -------------------------------------------------------- |
| `pbi-input`       | `pbi-input.md`       | Markdown     | Optional (rec.) | Free-form                                           | Input spec / background of the Product Backlog Item      |
| `plan`            | `plan.md`            | Markdown     | Optional (rec.) | Free-form                                           | Implementation plan and design rationale                 |
| `todo`            | `todo.md`            | Markdown     | Optional        | Free-form (checklist)                               | Implementation tasks and progress                        |
| `test-cases`      | `test-cases.md`      | Markdown     | Optional        | Free-form (bullets or tables)                       | Test case design                                         |
| `review-self`     | `review-self.md`     | Markdown     | Optional        | Free-form                                           | Self-review by the author                                |
| `review-external` | `review-external.md` | Markdown     | Optional        | Free-form                                           | External review (AI or human)                            |
| `diff`            | `diff.patch`         | unified diff | Required (alt.) | `git diff` compatible                               | Review target diff; falls back to `git diff` when absent |
| `junit`           | `junit.xml`          | XML          | Optional        | JUnit XML                                           | Unit/integration test results                            |
| `coverage`        | `coverage.xml` etc.  | XML / JSON   | Optional        | One of Cobertura / LCOV / Istanbul JSON             | Coverage report                                          |
| `lint`            | `lint.json` etc.     | JSON / plain | Optional        | ESLint JSON, stylelint JSON, or tool-specific plain | Lint result                                              |
| `typecheck`       | `typecheck.txt` etc. | plain / JSON | Optional        | tsc `--pretty=false` or tool-specific plain         | Type checker result                                      |

### Legend

- **Required**
  - `Required`: Without this input River Reviewer aborts.
  - `Required (alt.)`: If absent, an alternative (e.g. `git diff`) is used automatically.
  - `Optional`: Missing files are tolerated; related skills are skipped or degraded.
  - `Optional (rec.)`: Missing is allowed, but review quality drops meaningfully.
- **Format**: Encoding and syntax. Multiple accepted formats are comma-separated.

## Per-artifact Contract

### `pbi-input` / `plan` / `todo` / `test-cases`

- **Format**: UTF-8 Markdown. Heading structure and bullets are unconstrained.
- **Size guideline**: 100 KB or less per file recommended. Beyond that, River Reviewer may apply diff optimization (summarization / trimming).
- **When absent**: Skills referencing the artifact skip their observation and record it in `skippedSkills`.

### `review-self` / `review-external`

- **Format**: UTF-8 Markdown. Existing AI reviewer (including River Reviewer itself) or human review output may be stored verbatim.
- **When absent**: Double-check (W-check) skills are skipped.
- **Compatibility**: Content may follow the `issue` definition in [`schemas/output.schema.json`](../../schemas/output.schema.json), but this is not required.

### `diff`

- **Format**: unified diff (`git diff` compatible). Binary diffs are ignored.
- **Requirement**: A diff must be supplied by **some channel**. When absent, River Reviewer internally runs `git diff <mergeBase>..HEAD`.
- **When absent**: Status becomes `no-changes` and the review is not executed.

### `junit`

- **Format**: [JUnit XML](https://github.com/testmoapp/junitxml) compatible. Nested `<testsuite>` is permitted.
- **When absent**: Test-pass/fail skills are skipped.

### `coverage`

- **Format**: One of Cobertura XML, LCOV, or Istanbul JSON.
- **When absent**: Coverage skills are skipped.
- **Note**: Threshold evaluation is the skill's responsibility; this contract only fixes schema passthrough.

### `lint` / `typecheck`

- **Format**: Prefer JSON (ESLint / stylelint / tsc JSON), fall back to plain text. Skills perform a tool-specific light parse on plain input.
- **When absent**: Static-analysis skills are skipped.

## Input Channels

River Reviewer resolves artifacts in this order:

1. **CLI / GitHub Action arguments** (planned). Example: `--artifact pbi-input=./path/to/pbi-input.md`
2. **Configuration file** (planned). `artifacts` section in `river.config.*`.
3. **Current directory auto-detection** (fallback). Searches the workspace root for the default filenames above.

Artifacts not resolved by any channel are treated as "absent" and follow the per-artifact absence behavior above.

## Downstream Integration

### CLI

- `river run` records the resolved artifact set in the `context` / `debug` sections of the [Review Artifact](./review-artifact.en.md).
- Failure to resolve required artifacts exits with code `1`. See [Stable Interfaces](./stable-interfaces.en.md).

### Skills

- Individual skills declare the artifact IDs they require (details deferred to skill-pack design in follow-up issue #510).
- Skills requiring an unresolved artifact are auto-skipped and recorded in `plan.skippedSkills`.

### CI

- GitHub Action inputs (see `runners/github-action/action.yml`) will expose artifact wiring (details deferred to follow-up issue #511).
- CI should decide failure from the Review Artifact `status` and the severity mix of `findings`.

## PlanGate Independence

This contract treats PlanGate as **one of several possible producers** and deliberately avoids:

- Hard-coding PlanGate-specific directory layouts (e.g. `plangate/<phase>/`) as default paths.
- Adopting artifact names tied to PlanGate-internal commands or execution models.
- Assuming PlanGate versions and River Reviewer skill versions are co-released.

This keeps River Reviewer usable for workflows other than PlanGate or for artifacts generated manually.

## Versioning

- This contract is managed as document version `1` (when later formalized as JSON Schema, a `version` field will be added).
- Adding artifacts or extending formats is a minor bump (backward compatible); removal is a major bump.

## See Also

- [Review Artifact](./review-artifact.en.md) — Output schema for review runs
- [Stable Interfaces](./stable-interfaces.en.md) — CLI / GitHub Actions stable contract
- [Runner CLI Reference](./runner-cli-reference.en.md) — Runner CLI usage
- [Review Policy](./review-policy.en.md) — AI review policy
