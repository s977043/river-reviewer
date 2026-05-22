# Troubleshooting: `river review exec`

This page captures the silent-skip failure modes fixed across `v0.51.0` and `v0.51.1`, plus the one residual replay-side gap that is still open as [#802](https://github.com/s977043/river-reviewer/issues/802) A2-3.

## `river review exec` returns no findings despite a non-empty diff

**Symptom:** The CLI exits with `status: ok` but `findings.length === 0` and `plan.selectedSkills.length === 0`, even though the diff has real changes and skills exist.

**Root cause (fixed in v0.51.0):** Prior to v0.51.0, `river review exec` never forwarded `availableContexts` to the plan layer. Every skill that declared `inputContext: ['diff']` was silently moved into `plan.skippedSkills` with the reason `missing inputContext: diff`—the review ran and returned empty findings with no visible error.

### How to diagnose

Run with `--debug --output json` and inspect `plan.skippedSkills`:

```bash
river review exec --phase midstream --debug --output json --output-file /tmp/review.json
jq '{ selected: (.plan.selectedSkills | length), skipped: (.plan.skippedSkills | length) }' /tmp/review.json
```

If `selected` is `0` and `skipped` is large, run:

```bash
jq '[.plan.skippedSkills[] | select(.reasons[] | contains("missing inputContext"))]' /tmp/review.json
```

If that returns a non-empty list on `v0.50.0` or earlier, you hit this issue.

### Fix

Upgrade to `v0.51.0` or later. The plan layer now defaults `availableContexts` to `['diff']` whenever a diff artifact is resolved, so all skills with `inputContext: ['diff']` are selected without extra configuration.

### CI environments with additional artifact contexts

Set `RIVER_AVAILABLE_CONTEXTS` before invoking the CLI:

```bash
RIVER_AVAILABLE_CONTEXTS=diff,junit,coverage river review exec --phase midstream
```

Or pass `--context` directly:

```bash
river review exec --phase midstream --context diff,junit,coverage
```

The `'diff'` context is always retained when a diff artifact is resolved, so `--context tests` does not strip it.

---

## Skill appears in `skippedSkills` with reason `missing inputContext: <X>`

A skill declares `inputContext: ['<X>']` but `<X>` is not in the effective `availableContexts`.

**Resolution options:**

1. Add `<X>` to `RIVER_AVAILABLE_CONTEXTS` or `--context` if the artifact is genuinely available in this environment.
2. Drop the `inputContext` constraint from the skill metadata if it should always run.
3. Leave the skill skipped—`skippedSkills` is the correct outcome when the input is missing.

---

## Skill appears in `skippedSkills` with reason `missing dependency: <X>` (v0.51.1+)

A skill declares `dependencies: ['<X>']` (for example `code_search`, `test_runner`, `coverage_report`) but `<X>` is not in the effective `availableDependencies`.

**Fixed in:** `v0.51.1` ([#869](https://github.com/s977043/river-reviewer/pull/869))

Prior to `v0.51.1`, `river review exec` never forwarded `availableDependencies` to the plan layer at all, so dependency-based skip was effectively disabled on exec. The fix wires the same flow that `river run` has always used.

**Resolution options (now that the flow is honored):**

1. Pass `--dependency code_search,test_runner` on the CLI when the runner actually provides those capabilities.
2. Set `RIVER_AVAILABLE_DEPENDENCIES=code_search,test_runner` in the environment.
3. Set `RIVER_DEPENDENCY_STUBS=1` to enable the default stub set (`code_search`, `test_runner`, `coverage_report`, `adr_lookup`, `repo_metadata`, `tracing`). Useful for local dry-run experiments where you only want to confirm a skill _would_ be selected.
4. Leave the skill skipped—`skippedSkills` is the correct outcome when the dependency is unavailable.

The CLI's default is `null` (= dependency-based skipping disabled), preserving the legacy behaviour for callers that do not opt in.

---

## Finding output looks generic / missing ADR references (v0.51.1+)

**Symptom:** Findings appear, but ADR cross-references that worked on `river run` are missing, or phase-mismatch checks behave differently than `river run`.

**Fixed in:** `v0.51.1` ([#871](https://github.com/s977043/river-reviewer/pull/871))

Prior to `v0.51.1`, `river review exec` did not read the derived analysis context (`fileTypes`, `relatedADRs`, `reviewMode`) that `buildExecutionPlan` had already computed, and it did not pass them to the LLM call. Three effects were silent rather than failing:

- `fileTypes` missing → the verifier's file-phase coherence check fell back to lenient.
- `relatedADRs` missing → ADR cross-references were dropped from the prompt.
- `reviewMode` missing → the context budget preset (`tiny | medium | large`) was always the generateReview default rather than the calibrated value.

The fix is automatic in `v0.51.1+`; no configuration change is required.

---

## Where the plan layer forwards each context (reference)

This is the current contract between `runReviewPlan` and `buildExecutionPlan` / `generateReview` on the `river review exec` path:

| Source                                                                         | Field                                        | Forwarded since  |
| ------------------------------------------------------------------------------ | -------------------------------------------- | ---------------- |
| CLI `--context` / `RIVER_AVAILABLE_CONTEXTS`                                   | `availableContexts`                          | `v0.51.0` (#865) |
| CLI `--dependency` / `RIVER_AVAILABLE_DEPENDENCIES` / `RIVER_DEPENDENCY_STUBS` | `availableDependencies`                      | `v0.51.1` (#869) |
| Derived by `buildExecutionPlan`                                                | `fileTypes` (from changed files)             | `v0.51.1` (#871) |
| Derived by `buildExecutionPlan`                                                | `relatedADRs` (from impact tags + ADR index) | `v0.51.1` (#871) |
| Derived by `buildExecutionPlan`                                                | `reviewMode` (from diff size)                | `v0.51.1` (#871) |

`config` (loaded from `.river-reviewer.{json,yaml}`) is already forwarded to `generateReview` since `v0.51.0`.

---

## Residual gap: `--plan` replay does not yet run skills

`river review exec --plan <path>` still echoes the source plan as a Review Artifact with `findings: []` and does not invoke the execution adapter. This is intentional in `v0.51.x`—it locks the "replay does not re-plan" contract from PR #861 (B')—and is tracked as the next slice ([#802](https://github.com/s977043/river-reviewer/issues/802) A2-3).

If you need findings, run `river review exec` without `--plan` so the internal plan path executes.

---

## See also

- [CLI reference: `river review exec`](../../pages/reference/cli-review-exec-spec.md)
- [Deprecated: `debug.executionDeferred`](../deprecated.md#output-artifact-field-debugexecutiondeferred-v0510)
