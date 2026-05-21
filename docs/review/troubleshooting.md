# Troubleshooting: river review exec

## river review exec returns no findings despite a non-empty diff

**Symptom:** The CLI exits status: ok with findings_count: 0 and
selected_count: 0 even though the diff has real changes and skills exist.

**Root cause (fixed in v0.51.0):** Prior to v0.51.0, river review exec never
forwarded availableContexts to the plan layer. Every skill with
inputContext: [diff] was silently moved into skippedSkills -- the review ran
and returned empty findings with no visible error.

### How to diagnose

Run with --debug --output json and inspect plan.skippedSkills:

```bash
river review exec --phase midstream --debug --output json --output-file /tmp/review.json
jq "{selected: (.plan.selectedSkills|length), skipped: (.plan.skippedSkills|length)}" /tmp/review.json
```

If selected is 0 and skipped is large, you hit this issue.

### Fix

Upgrade to v0.51.0+. The plan layer now defaults availableContexts to [diff]
whenever a diff artifact is resolved, so all skills with inputContext: [diff]
are selected without extra configuration.

### CI environments with additional artifact contexts

Set RIVER_AVAILABLE_CONTEXTS before invoking the CLI:

```bash
RIVER_AVAILABLE_CONTEXTS=diff,junit,coverage river review exec --phase midstream
```

Or pass --context directly:

```bash
river review exec --phase midstream --context diff,junit,coverage
```

---

## Skill appears in skippedSkills with reason: missing inputContext X

A skill declares inputContext: [X] but X is not in availableContexts.

**Resolution options:**

1. Add X to RIVER_AVAILABLE_CONTEXTS / --context if the artifact is genuinely available.
2. Remove the inputContext constraint from the skill if it should always run.

---

## See also

- [CLI reference: river review exec](../pages/reference/cli-review-exec-spec.md)
- [Deprecated: executionDeferred](deprecated.md#output-artifact-field-executiondeferred-v0510)