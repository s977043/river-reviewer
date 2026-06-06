# Review Gates Design (#976)

## Status

Design decision for #976 ("pre-execution review gates + per-phase verdict
thresholds"). This issue asked whether to build a `review-gates` system
inspired by `codex-dynamic-workflows` for requirements / design / plan review
before implementation. **Conclusion: most of the capability already exists;
this doc records what to reuse, what is a genuine gap, and what not to adopt.**

## TL;DR decisions

- **Do not add new top-level commands** (`river-review-requirements`, etc.).
  Keep `river run` and `river review plan|exec|verify`. Requirements / Design /
  Plan review are selected by **artifacts + a skill set**, not by new commands —
  consistent with the project's "no new top-level command / no new routing
  config" stance (Epic #1024).
- **Do not adopt `codex-dynamic-workflows` directly** (unofficial, unclear
  safety/reproducibility/ownership). Extract only the *pattern*: gate the work
  by review stage, emit evidence, and stop/escalate via a verdict.
- **Ship now (this issue): a `pre-exec` recommended skill set** bundling the
  existing upstream review skills, so `river review plan --skill-set pre-exec`
  runs a pre-execution gate today with no new code.
- River Review **reviews** (findings + verdict); PlanGate **gates** (GO / NO-GO).
  Already documented in `pages/explanation/review-scope.md`; unchanged here.

## What already exists (vision → implementation map)

| #976 review target | Status | Existing implementation |
| --- | --- | --- |
| Requirements Review | covered | `rr-upstream-requirements-acceptance-001` (skill) |
| Design Review | covered | `rr-upstream-architecture-validation-plan-001`, `rr-upstream-architecture-boundaries-001` |
| Plan Review | covered | `rr-upstream-plangate-plan-integrity-001` (plan/pbi-input/todo/test-cases integrity) |
| Diff Review | covered | `river run` / `river review exec` + midstream skills; conformance via `rr-upstream-plangate-exec-conformance-001` |
| Evidence/Report Review | partial | `rr-upstream-plangate-verification-audit-001` (W-check / META findings); `verify` gate runtime is a stub |
| GO / NO-GO verdict | covered | `deriveVerdict` (`auto-approve` / `human-review-recommended` / `human-review-required`) |
| Input contract | covered | artifact-resolver: `pbi-input` / `plan` / `todo` / `test-cases` / `adr` / `diff` / `review-self` / `review-external` |
| Concept docs | covered | `pages/explanation/review-scope.md` documents pre-execution Requirements/Design/Plan review and the River↔PlanGate split |

## CLI naming decision

`river review <subcommand>` already maps onto #976's stages:

| #976 stage | River command + selection |
| --- | --- |
| Requirements / Design / Plan review (pre-exec) | `river review plan --skill-set pre-exec` with `pbi-input` / `plan` / `adr` artifacts |
| Diff review | `river run .` or `river review exec` |
| Evidence / report review | `river review verify` (W-check; runtime still a stub — see gaps) |

The proposed `river-review-requirements` / `river-review-design` style is
**rejected**: it would add five top-level commands, conflicting with
single-command naming and the existing subcommand model. Stage selection is a
*skill-set / artifact* concern, not a command concern.

## The `pre-exec` skill set (shipped with this issue)

Added to `skills/registry.yaml`:

```yaml
pre-exec:
  description: 'Pre-execution review gate: requirements / design / plan checks before implementation'
  skills:
    - rr-upstream-requirements-acceptance-001
    - rr-upstream-architecture-validation-plan-001
    - rr-upstream-plangate-plan-integrity-001
```

Usage (PoC workflow—the one workflow #976 asks to pick first):

```bash
# Before implementation: gate requirements + design + plan together.
river review plan --skill-set pre-exec \
  --artifact pbi-input=pbi-input.md \
  --artifact plan=plan.md \
  --artifact adr=docs/adr/00x.md
```

It reuses the existing `--skill-set` mechanism (no new code). `exec-conformance`
(an exec-time gate) and `verification-audit` (a verify-time gate) are
deliberately **not** in this set—they are different gates, not pre-execution
checks.

## Review-gates responsibilities (clarified)

A "gate" in River Review is a `river review <plan|exec|verify>` run scoped by
phase + skill set + artifacts. It is responsible for:

- selecting the right review skills for the stage (skill `applyTo` / phase /
  `--skill-set`),
- producing findings with severity + evidence,
- emitting a verdict (`deriveVerdict`) as *advice*.

It is **not** responsible for blocking—that is PlanGate's role (GO / NO-GO).
There is intentionally no separate `review-gates/` config directory or
`gates.yaml`: gates are expressed with existing knobs (skill set, artifacts,
risk-map), per the no-new-routing-config principle.

## Genuine gaps → follow-up implementation issues

1. **`river review verify` runtime**—CLI contract exists; skill execution
   returns exit 3 (stub). Needed for Evidence/report W-check.
2. **`--output markdown` rendering**—only JSON today; needed for PR comments.
3. **Per-gate fail/warn thresholds**—`--fail-on` / `--warn-on` are specced
   but not wired; needed to turn the advisory verdict into a CI gate.
4. **Registry drift**—`rr-upstream-plangate-exec-conformance-001` and
   `rr-upstream-plangate-verification-audit-001` exist on disk but are missing
   from the `skills:` catalog in `registry.yaml`. Catalog them in a follow-up.

These are independent, additive, and each splittable into its own issue.

## Not adopted

- `codex-dynamic-workflows` as a dependency or imported Skill (unofficial;
  ownership/safety/reproducibility concerns). Only the staged-gate + evidence +
  verdict *pattern* is reflected, and it was already largely present.
- A new `review-gates/` config surface or `river-review-*` command family.
