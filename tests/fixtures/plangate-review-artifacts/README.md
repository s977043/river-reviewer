# plangate-review-artifacts fixture

Minimal PlanGate-style upstream artifact set for the `river review plan
--plan-only` CLI integration E2E
(`tests/integration/review-plan-cli.test.mjs`, issue #802 Phase 3 slice 2).

These are newly created rather than reused from `tests/fixtures/planner-dataset/`:
that dataset holds `.diff` files keyed to planner-selection evaluation cases,
not the per-artifact-ID files (`plan.md`, `todo.md`, `diff.patch`) plus a
`.river-reviewer.json` that the artifact resolver's CLI → config → cwd-default
precedence needs to be exercised end-to-end.

Files:

- `plan.md` / `todo.md` — cwd-default tier inputs (`plan.md`, `todo.md`)
- `diff.patch` — `diff` artifact (resolver resolves the path only; no diff is
  consumed in `--plan-only`, where no skills run)
- `config/.river-reviewer.json` — copied to the repo root in the test to
  exercise the config tier (`artifacts.todo` → a non-default path)
