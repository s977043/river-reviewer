---
id: rr-upstream-architecture-validation-plan-001
name: Architecture Validation Plan Guard
description: Detect missing validation plans (how to verify the design is correct) in design documents and ADRs.
version: 0.1.0
phase: upstream
applyTo:
  - 'docs/**/*design*.md'
  - 'docs/**/*architecture*.md'
  - 'docs/adr/**/*'
  - 'docs/architecture/**/*'
  - 'pages/**/*design*.md'
  - 'pages/**/*architecture*.md'
  - '**/*.adr'
tags:
  - architecture
  - validation
  - verification
  - slo
  - upstream
severity: minor
inputContext:
  - diff
  - adr
outputKind:
  - findings
  - actions
  - questions
modelHint: balanced
dependencies:
  - adr_lookup
  - repo_metadata
---

## Guidance

- Ensure design docs include how success is proven: SLO/SLI targets and validation/test plans.
- Check rollout/rollback/canary/DR strategies have criteria, owners, and fallback steps.
- Confirm observability plans (logs/metrics/alerts) cover new risks and failure paths.
- Flag missing validation for new dependencies or contracts introduced in the diff.

## Non-goals

- ツール選定や好みのアプローチを推測で断定しない。

## False-positive guards

- 小さなリファクタや差分外で検証計画が明示されている場合は指摘しない。
