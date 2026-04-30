# River Reviewer

**Turn Implicit Knowledge into Reproducible Agent Skills.**
**An experimental AI code review framework that turns tacit knowledge into reusable Agent Skills.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-available-blue)](https://river-reviewer.vercel.app/explanation/intro/)

![River Reviewer logo](assets/logo/river-reviewer-logo.svg)

English edition. The primary Japanese README lives in `README.md`.
[日本語の README はここ](./README.md)—the Japanese copy is the source of truth; English may lag.

## License Overview

| Scope                                          | License   | Details                              |
| ---------------------------------------------- | --------- | ------------------------------------ |
| Source code (`src/`, `scripts/`, `tests/`)     | MIT       | [LICENSE-CODE](./LICENSE-CODE)       |
| Documentation (`pages/`, `skills/`, `assets/`) | CC BY 4.0 | [LICENSE-CONTENT](./LICENSE-CONTENT) |
| Configuration (`.github/`, `*.config.*`)       | MIT       | [LICENSE](./LICENSE)                 |

## Getting Started

| Goal                    | Destination                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| Try it in 5 minutes     | [Quick start (GitHub Actions)](#quick-start-github-actions)                              |
| Add to an existing repo | [Setup guide](https://river-reviewer.vercel.app/guides/github-actions/)                  |
| Create your first skill | [Skill tutorial](https://river-reviewer.vercel.app/tutorials/creating-your-first-skill/) |
| Understand the design   | [Architecture docs](https://river-reviewer.vercel.app/explanation/river-architecture/)   |

Philosophy: [Why we built it](#philosophy)

Review that Flows With You. 流れに寄り添う AI レビューエージェント。

River Reviewer is a context engineering framework for AI code review. It is flow-based and metadata-driven, traveling the SDLC so design intent, implementation choices, and test coverage stay connected.

<a id="philosophy"></a>

## The Philosophy (Why we built it)

> **We stopped believing "polish the prompt and you win."**

The biggest barrier to production AI review is not prompt quality but repeatability of review findings and operating cost.
River Reviewer is not just a tool that lets an AI read code.

We define team-specific judgment criteria and review procedures as reusable **Agent Skills (a toolbox with manuals)**, so they can be grown as durable organizational assets.

🔗 **Read the full story (Japanese):**
[「プロンプトを磨けば勝てる」をやめた：AIレビューを運用に乗せる“Agent Skills”設計](https://note.com/mine_unilabo/n/nd21c3f1df22e)

## Flow story

- **Upstream (design)**: ADR-aware checks keep architecture decisions aligned before code drifts.
- **Midstream (implementation)**: style and maintainability guardrails guide everyday coding.
- **Downstream (tests/QA)**: test-focused skills highlight coverage gaps and failure paths.
- **Phase-aware routing**: skills are selected by `phase` and file metadata, so feedback matches where you are in the stream.

## Positioning: artifact-driven review agent

River Reviewer is an **artifact-driven review agent**. It consumes externally supplied artifacts (`plan` / `diff` / `test-cases` / `junit`, etc.) and produces review results that include `findings`. The input contract is defined in the [Artifact Input Contract](pages/reference/artifact-input-contract.en.md), and the output schema in the [Review Artifact](pages/reference/review-artifact.en.md) reference.

The primary integration today is with **PlanGate v6**: River Reviewer receives `plan` / `pbi-input` artifacts produced by PlanGate and inspects them for design integrity and implementation conformance using dedicated skills.

### Four use cases

> **Note**: The `river review plan` / `river review exec` / `river review verify` CLI commands are under development (tracked in Issue #509). Until the implementation is complete, the workflow steps run as placeholders.

- **Design review**: pass `pbi-input` / `plan` to check plan integrity and completeness with upstream skills (e.g. `skills/upstream/rr-upstream-plangate-plan-integrity-001/`).
- **Implementation review**: pass `plan` + `diff` to check that the code change matches the plan (e.g. `skills/upstream/rr-upstream-plangate-exec-conformance-001/`).
- **QA review**: pass `test-cases` / `junit` / `coverage` so downstream skills can surface coverage gaps and failure paths.
- **Double-check (W-check)**: pass existing AI or human review output as `review-self` / `review-external` to review the review itself.

### CLI examples (under development)

See [`river review plan` CLI spec](pages/reference/cli-review-plan-spec.en.md) and [`river review exec` CLI spec](pages/reference/cli-review-exec-spec.en.md) for full details.

```bash
# Design review: inspect the plan alone
river review plan --artifact plan=./artifacts/plan.md

# Implementation review: check the diff against the plan
river review exec \
  --artifact plan=./artifacts/plan.md \
  --artifact diff=./artifacts/diff.patch

# QA review: add test-related artifacts
river review exec \
  --artifact diff=./artifacts/diff.patch \
  --artifact test-cases=./artifacts/test-cases.md \
  --artifact junit=./artifacts/junit.xml
```

## Quick start (GitHub Actions)

Minimal workflow using the v1 action tag. `phase` is a future/optional input that will route skills per SDLC phase.

```yaml
name: River Reviewer
on:
  pull_request:
    branches: [main]
jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - name: Run River Reviewer (midstream)
        uses: s977043/river-reviewer/runners/github-action@v0.28.0
        with:
          phase: midstream # upstream|midstream|downstream|all (future-ready)
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

Pin to a release tag such as `@v0.28.0` for stability. Optionally, you can maintain a floating alias tag like `@v0`.

<!-- x-release-please-start-version -->

Latest release: [v0.28.0](https://github.com/s977043/river-reviewer/releases/latest)

<!-- x-release-please-end -->

> **ℹ️ Upgrading from v0.1.x:** v0.2.0 and later use the new GitHub Action path `runners/github-action` instead of `.github/actions/river-reviewer`. See [Migration Guide](docs/migration/runners-architecture-guide.md) and [DEPRECATED.md](docs/deprecated.md) for details.

## Quick start (local)

1. Environment: Node 22+ recommended (CI runs on Node 22; Unit tests also validate Node 20.x)
2. Install dependencies: `npm install`
3. Validate skills: `npm run skills:validate`
4. Validate Agent Skills (optional): `npm run agent-skills:validate`
5. Tests: `npm test`
6. Planner evaluation (optional): `npm run planner:eval`
7. Review fixtures evaluation (optional): `npm run eval:fixtures` (must_include style)
8. Repo-wide evaluation (optional): `npm run eval:repo-context` (measures detection / context lift / false positive against the [#688](https://github.com/s977043/river-reviewer/issues/688) repo-wide fixtures)
9. Docs development (optional): `npm run dev`

### Major features added in v0.21–v0.28

- **Suppression memory** ([#687](https://github.com/s977043/river-reviewer/issues/687)): use `river suppression add --fingerprint <fp> --feedback accepted_risk` to stop re-surfacing accepted-risk findings. Set `memory.suppressionEnabled: false` to bypass the gate temporarily.
- **Secret redaction** ([#692](https://github.com/s977043/river-reviewer/issues/692)): multi-stage redaction across repo-wide context and LLM prompts. Tune categories, allowlist, and denyFiles via `security.redact.*`.
- **Context budget / ranking / reviewMode** ([#689](https://github.com/s977043/river-reviewer/issues/689)): `context.budget` for token / char caps, `context.ranking.enabled` for proximity-based reordering, `context.reviewMode: tiny | medium | large` for preset budgets.
- **Repo-wide eval suite** ([#688](https://github.com/s977043/river-reviewer/issues/688)): `npm run eval:repo-context` reports detection rate, context lift, and false positive rate.

See [`pages/guides/repo-wide-review.md`](pages/guides/repo-wide-review.md) and [`pages/reference/config-schema.md`](pages/reference/config-schema.md) for details.

### Local review run (river run .)

- After installation, run `npx river run . --dry-run` to print skill selection and placeholder review comments for the current diff without sending anything externally (local mode is currently planning/preview only)
- Add `--debug` to show merge base, changed files, token estimate, and a diff preview
- Specify phase via `--phase upstream|midstream|downstream`; defaults to `RIVER_PHASE` env or `midstream`
- Control contexts/dependencies (optional): set `RIVER_AVAILABLE_CONTEXTS=diff,tests` or `RIVER_AVAILABLE_DEPENDENCIES=code_search,test_runner` to skip skills that require unavailable inputs; if unset, dependency checks are bypassed for backward compatibility.
- Override via CLI flags: `--context diff,fullFile` and `--dependency code_search,test_runner` override the env vars (comma-separated).
- Enable stub dependencies: set `RIVER_DEPENDENCY_STUBS=1` to treat known dependencies (`code_search`, `test_runner`, `coverage_report`, `adr_lookup`, `repo_metadata`, `tracing`) as available so planning doesn’t skip them while provider implementations are being readied.

## Skills

Skills are Markdown files with YAML frontmatter; River Reviewer uses the metadata to load and route them.

```markdown
---
id: rr-midstream-code-quality-sample-001
name: Sample Code Quality Pass
description: Checks common code quality and maintainability risks.
category: midstream
phase: midstream # kept for backward compatibility
applyTo:
  - 'src/**/*.ts'
tags: [style, maintainability, midstream]
severity: minor
---

- Instruction text for the reviewer goes here.
```

- Sample skills: `skills/upstream/sample-architecture-review.md`, `skills/midstream/sample-code-quality.md`, `skills/downstream/sample-test-review.md`
- Examples: `examples/README.md`
- Schemas: `schemas/skill.schema.json` (skill metadata) and `schemas/output.schema.json` (structured review output)
- References: Skill schema details live in `pages/reference/skill-schema-reference.md`; Riverbed Memory v1 (shipped in #474) is documented in `pages/explanation/riverbed-memory.md` and `pages/guides/use-riverbed-memory.md`.
- Known limitations: `pages/reference/known-limitations.md`
- Troubleshooting: `pages/guides/troubleshooting.md`

## AI Review Standard Policy

River Reviewer follows a standard review policy to maintain consistent quality and reproducibility. The policy defines evaluation principles, output format, and prohibited actions to ensure constructive and specific feedback.

- **Evaluation Principles**: Intent understanding, risk identification, impact assessment
- **Output Format**: Summary, Comments (specific findings), Suggestions (improvement proposals)
- **Prohibited Actions**: Excessive speculation, abstract reviews, inappropriate tone, out-of-scope findings

For details, see [AI Review Standard Policy](pages/reference/review-policy.en.md).

## Documentation design

River Reviewer’s technical documentation follows the
[Diátaxis documentation framework](https://diataxis.fr/). Japanese is the default language; English editions use the `.en.md` suffix and are maintained on a best-effort basis.

We organize content into four types, mapped by directory under `pages/` and served at `/docs`:

- Tutorials—step-by-step lessons for new users (`pages/tutorials/*.md` / `*.en.md`)
- Guides—recipes for achieving specific tasks (`pages/guides/*.md` / `*.en.md`)
- Reference—accurate technical facts (`pages/reference/*.md` / `*.en.md`)
- Explanation—background and reasoning (`pages/explanation/*.md` / `*.en.md`)

## Roadmap

- Phase-aware review expansion across upstream → midstream → downstream
- Riverbed Memory to retain ADR links, WontFix decisions, and past findings
- Evals/CI integration to keep the agent trustworthy over time

Milestones and the repository Projects are the source of truth for progress (this README list is only a high-level overview).

- Milestones: [river-reviewer/milestones](https://github.com/s977043/river-reviewer/milestones)
- Projects: [Repository Projects page](https://github.com/s977043/river-reviewer/projects)

(Optional) Add one of `m1-public` / `m2-dx` / `m3-smart` / `m4-community` to an issue.
This will auto-assign the corresponding milestone (`.github/workflows/auto-milestone.yml`).

## Contributing

See `CONTRIBUTING.md` for guidance. Issues and PRs are welcome as we expand River Reviewer.

- Review checklist: `pages/contributing/review-checklist.md`

## License

This repository uses multiple licenses by asset type.

- `LICENSE-CODE` (MIT): code and scripts
  - Examples: `src/**`, `scripts/**`, `tests/**`
- `LICENSE-CONTENT` (CC BY 4.0): documentation, text, and media
  - Examples: `pages/**`, `skills/**`, `assets/**`, root `*.md`
- `LICENSE` (Apache-2.0): repository scaffolding and configuration
  - Examples: `.github/**`, `docusaurus.config.js`, `sidebars.js`, `package*.json`, `*.config.*`, `.*rc*`

If you're unsure which license applies to newly added files, please call it out in the PR and discuss it.
