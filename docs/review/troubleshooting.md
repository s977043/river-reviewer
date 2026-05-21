# Troubleshooting: `river review exec`

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

If that returns a non-empty list on v0.50.0 or earlier, you hit this issue.

### Fix

Upgrade to v0.51.0 or later. The plan layer now defaults `availableContexts` to `['diff']` whenever a diff artifact is resolved, so all skills with `inputContext: ['diff']` are selected without extra configuration.

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

## See also

- [CLI reference: `river review exec`](../../pages/reference/cli-review-exec-spec.md)
- [Deprecated: `debug.executionDeferred`](../deprecated.md#output-artifact-field-debugexecutiondeferred-v0510)
