---
title: Loop Convergence Contract (stop conditions for the self-fix loop)
---

River Review acts as the **review stage** in a generate → review → revise loop. River Review only returns judgment materials (`decision` / `summary.issueCountBySeverity` / `oscillated` / exit code); iteration, stopping, and escalation are the **caller's responsibility** (the invoking agent or workflow). See [#976 boundary — docs/ai/generate-review-revise-loop.md](../../docs/ai/generate-review-revise-loop.md).

This document defines the stop / convergence / divergence-guard contract that callers need to implement loop control, in one page.

## Stop (convergence) conditions — composite formula

### Why `decision == "auto-approve"` alone is not a stop condition

`auto-approve` is advice meaning "bypass Human-in-the-Loop". It can be returned even when minor / info findings remain. Using it as the sole stop criterion risks exiting the loop with significant findings still open.

### Recommended stop / continue logic

| Condition                                            | Recommended action                                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `summary.issueCountBySeverity.critical + .major > 0` | **Continue (revise)**: blocking findings remain; keep fixing                                                                             |
| `critical == 0` and `major == 0`                     | **Converged**: exit the loop and advance to the next stage. Whether to accept minor / info follows the caller's policy (default: accept) |
| `decision == "human-review-required"`                | **Escalate immediately**: hand off to a human reviewer                                                                                   |
| `river runs diff` returns non-empty `oscillated`     | **Escalate immediately**: revising is introducing new problems (oscillation). See "Oscillation detection" below                          |

Pseudo-code for the composite condition:

```text
if decision == "human-review-required":
    escalate_to_human(result)
    stop
if oscillated is non-empty:
    escalate_to_human(result, reason="oscillation")
    stop
if critical + major == 0:
    # converged; handling of minor / info is caller policy
    break  # exit loop
else:
    revise(result.issues)
    continue  # next iteration
```

## Divergence guards

Two safety mechanisms when an autonomous loop fails to converge.

- **max iterations (recommended 3–5)**: an upper bound on iteration count. When the limit is reached, escalate to a human and force-stop the loop.
- **loop-until-dry (zero new findings for N consecutive rounds)**: compare the previous and current reviews with `river runs diff`; if `new` findings are zero for N rounds (recommended: 2), treat as converged. When the same findings keep appearing, further revising will not improve the situation — escalate to a human.

```bash
# Save the run, then diff to check for new findings
river run . --base main --output json --save
river runs diff <prev_run_id> <curr_run_id>
# If new[] is empty, count it as 1 round toward loop-until-dry
```

## Oscillation detection

When a finding that was resolved in one iteration reappears in the next, the revise step is introducing another problem (oscillation).

```bash
# Passing 3 or more run IDs includes `oscillated` in the JSON output
river runs diff <id1> <id2> <id3>
```

When `oscillated` is non-empty, the caller escalates immediately. Detection is based on `finding-fingerprint` (`ruleId + file + message` prefix), so the same finding is tracked even when line numbers shift due to a fix.

## Exit code contract (implementation-accurate)

Exit codes other than 0 are only produced when `--fail-on` / `--warn-on` is specified. **Without `--fail-on`, River Review always exits 0.**

| Exit code | Condition                                                                | Description                            |
| --------- | ------------------------------------------------------------------------ | -------------------------------------- |
| `0`       | `--fail-on` not specified / `--advisory-only` / max severity < warn rank | Pass. Always 0 regardless of findings  |
| `1`       | `--fail-on <sev>` specified and max severity ≥ fail rank                 | Fail. Blocking threshold met           |
| `2`       | `--warn-on <sev>` specified and max severity ≥ warn rank but < fail rank | Warn. Threshold reached but not a fail |
| `1`       | Invalid input / git diff failure / `--max-cost` exceeded, etc.           | Error exit                             |

Severity rank (low → high): `info`=0 / `minor`=1 / `major`=2 / `critical`=3

> **Recommended CI / agent setup**: explicitly add `--fail-on critical --warn-on major` to enable exit-code-based branching. Without `--fail-on`, findings produce exit 0, so for machine decisions, reading `summary.issueCountBySeverity` directly (see examples below) is more reliable.

## Minimal machine-consumption examples

### Convergence check from JSON output (no flags)

A pattern that reads JSON directly instead of using `--fail-on`.

```bash
#!/usr/bin/env bash
result=$(river run . --base main --output json --save)
run_id=$(echo "$result" | jq -r '.runId // empty')

critical=$(echo "$result" | jq '.summary.issueCountBySeverity.critical // 0')
major=$(echo "$result" | jq '.summary.issueCountBySeverity.major // 0')
decision=$(echo "$result" | jq -r '.decision // "unknown"')

if [ "$decision" = "human-review-required" ]; then
  echo "ESCALATE: human review required" >&2
  exit 2
fi

if [ $((critical + major)) -gt 0 ]; then
  echo "REVISE: critical=$critical major=$major" >&2
  exit 1  # caller continues the loop
fi

echo "CONVERGED: proceed to next stage"
```

### Loop example with oscillation detection

```bash
#!/usr/bin/env bash
prev_id=""
dry_count=0
max_iter=5

for i in $(seq 1 $max_iter); do
  result=$(river run . --base main --output json --save)
  curr_id=$(echo "$result" | jq -r '.runId // empty')

  # Oscillation detection (requires 3 or more run IDs)
  if [ -n "$prev_id" ] && [ -n "$curr_id" ]; then
    oscillated=$(river runs diff "$prev_id" "$curr_id" --output json \
                   | jq '.oscillated // [] | length')
    if [ "$oscillated" -gt 0 ]; then
      echo "OSCILLATION DETECTED: escalate to human" >&2
      exit 3
    fi
  fi

  critical=$(echo "$result" | jq '.summary.issueCountBySeverity.critical // 0')
  major=$(echo "$result" | jq '.summary.issueCountBySeverity.major // 0')

  if [ $((critical + major)) -eq 0 ]; then
    echo "CONVERGED after $i iteration(s)"
    exit 0
  fi

  prev_id="$curr_id"
  # caller performs the revise step here
done

echo "MAX ITERATIONS reached: escalate to human" >&2
exit 4
```

## Related documents

- [AI-Driven Development Playbook (Case 2 / Case 3)](../guides/ai-agent-playbook.en.md) — case-by-case invocation guide
- [generate → review → revise loop design](../../docs/ai/generate-review-revise-loop.md) — background design for convergence control (#1150 S2a source doc)
- [Stable Interfaces (CLI / GitHub Actions)](./stable-interfaces.en.md) — CLI stable contract including exit codes
