# A2-3 Replay Execution Design (#878)

Design-only note. Implementation is **out of scope** for the session in which
this doc was written; this doc exists to unblock a future implementation slice
by fixing the three open questions identified in
[`execution-context-contract.md` §Replay path](./execution-context-contract.md#replay-path---plan-pathcurrent-contract-and-a2-3-gap).

## Status

- ExecutionContext contract is fixed (#880, see `execution-context-contract.md`).
- Replay echo contract is shipped (#861).
- Skill-execution integration on the no-flags path is shipped (#864 + A2-fix-1..4).
- **A2-3 is the last silent-skip slice on the exec path**—the `--plan` route
  still returns `findings: []` regardless of `--execute-review`.

## The carry-over decision

The contract proposal (execution-context-contract.md §Replay) names four fields
that must travel with the plan for replay to be "honest"—i.e. avoid
re-deriving from a current repo state that has moved on since plan creation:

- `phase`—already carried.
- `fileTypes`
- `relatedADRs`
- `reviewMode`
- `riskAssessment`

The current `review-artifact.schema.json` v1 does not carry the last four on
`plan.selectedSkills`. **A2-3 cannot proceed without resolving where these live.**

### Option A—schema v2 (breaking)

Add `plan.context: { fileTypes, relatedADRs, reviewMode, riskAssessment }` to
`review-artifact.schema.json` and bump `version` to `'2'`. Pros: explicit, easy
to validate, easy to inspect by hand. Cons: existing v1 artifacts (every
release-please CI plan from v0.51.0–v0.57.0) become non-replayable without a
migration step. Forces every consumer to track the version.

### Option B—`debug.execution.snapshot` extension (additive)

Keep schema v1; add a non-required `debug.execution.snapshot` object holding
the same four fields. `runReviewExecReplay` reads it if present and falls back
to "don't execute, return `findings: []` with `debug.replay.drift.reason =
'snapshot-absent'`" if absent. Pros: backward compatible—any artifact from
v0.61.0+ replays, anything older is gracefully degraded, not broken. Cons:
the field lives under `debug.*` which signals "diagnostic, not contract" —
the contract treats it as authoritative, which is mildly dishonest naming.

### Option C—re-derive locally, mark drift

Don't change the schema. On replay, re-compute the four fields from the
current diff and emit a `debug.replay.drift` block enumerating which fields
changed from what the source plan implied. Pros: zero schema churn. Cons: this
is exactly the "context snapshot drift" the contract is trying to prevent;
findings would be plausibly wrong on stale plans.

### Recommendation

**Option B**. Specifically:

- Add `debug.execution.snapshot` to schema (additive; `additionalProperties` on
  `debug` is already permissive).
- Document the field as _contract_, even though it lives under `debug`. The
  alternative—renaming to `plan.context`—is a v2 break and is not worth it
  for an internal-only handoff between plan and replay.
- Replay path: read snapshot, pass it to `generateReview` as the carry-over.
  If absent, **fail loud** with a clear error pointing at this doc (per
  Code-gen self-review "failure mode" in AGENTS.md).

## Drift handling

Even with carry-over, the **diff** itself comes from the current artifact
resolution (the source plan does not snapshot the diff bytes). This is
intentional—snapshotting raw diff bytes blows up artifact size for little
gain in correctness. The drift signal lives in `debug.replay.drift`:

```json
{
  "debug": {
    "replay": {
      "sourceTimestamp": "2026-05-25T03:48:53Z",
      "drift": {
        "filesAdded": ["..."],
        "filesRemoved": ["..."],
        "filesModified": ["..."],
        "summary": "3 changed files vs. 2 in source plan"
      }
    }
  }
}
```

Drift is **reported, not blocking**. A future skill can consume the drift
report to decide whether to re-plan.

## Failing test specification

The first deliverable of the implementation slice is a failing integration test:

- File: `tests/cli-review-exec-replay.test.mjs` (new)
- Setup: fixture plan JSON with one `selectedSkills[]` entry and a synthetic
  `debug.execution.snapshot` matching the new contract.
- Invocation: spawn `node src/cli.mjs review exec --plan <fixture-path>
--execute-review`.
- Assertion: stdout JSON has `findings[].length >= 1`.
- Current behavior: PASSes the schema check but `findings` is empty → test
  must fail.

Naming the test after the failure mode (per `execution-context-contract.md`
§Naming conventions): `"silent-skip: --plan replay returns findings: [] when
--execute-review is set"`.

## Slice plan

Implementation is split into 3 PRs, each shippable independently:

| Slice         | Scope                                                                                                                                                | Risk   | Verifies                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------- |
| **A2-3-pre**  | Add `debug.execution.snapshot` to schema. Update `buildExecutionPlan` to populate it on the no-flags path. Add unit test that the field round-trips. | Low    | Schema is forward-compatible with old artifacts |
| **A2-3-test** | Add the failing integration test above. Confirm it fails on `main`.                                                                                  | None   | Locks the contract                              |
| **A2-3-impl** | Wire `runReviewExecReplay` to read snapshot, call `generateReview`, return findings + drift.                                                         | Medium | The failing test passes                         |

## Codify-then-validate self-check (this design)

Per `AGENTS.md` Self-Review Checklist:

1. **3 failure scenarios for this design:**
   - Source plan is older than the snapshot schema → graceful fallback to
     replay-echo (Option B fallback handles this).
   - User passes a hand-edited plan with mismatched snapshot vs. selectedSkills
     → validate consistency at read time, fail loud.
   - Schema additive change unexpectedly breaks downstream consumers reading
     `debug.execution.*` strictly → mitigated by JSON Schema
     `additionalProperties: true` on `debug.execution` (verify before A2-3-pre).
2. **Reopen condition (if this design is wrong):** the integration test in
   A2-3-test is the source of truth. If the assertion is met by a different
   approach (e.g. Option A wins after team review), update this doc rather
   than the test.
3. **Gray-zone:** "stale plan replay"—how stale is too stale? Out of scope:
   drift is reported, the user decides. No threshold codified.

## Out of scope for this design

- Verify CLI (`river review verify`)—separate issue if needed.
- Diff snapshotting (Option D, dismissed above).
- `--max-cost` / `--estimate` wiring—different epic.
- Migration tooling for v1 artifacts to v2 (only relevant if Option A is later picked).

## References

- [#878](https://github.com/s977043/river-reviewer/issues/878) A2-3 tracker
- [#880](https://github.com/s977043/river-reviewer/pull/880) ExecutionContext doc
- [`execution-context-contract.md`](./execution-context-contract.md)
- `src/lib/review-plan.mjs` (`runReviewExecReplay`)
- `schemas/review-artifact.schema.json`
