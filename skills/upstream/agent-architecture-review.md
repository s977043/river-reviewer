---
id: agent-architecture-review
name: Architecture Review
description: 変更の全体設計、責務分離、境界の破綻を検知するためのレビュー手順。
category: upstream
phase: upstream
applyTo:
  - 'docs/**/*architecture*.md'
  - 'docs/adr/**/*'
  - 'pages/**/*architecture*.md'
  - '**/*.adr'
tags:
  - agent
  - architecture
  - design
severity: major
inputContext:
  - diff
  - adr
outputKind:
  - findings
  - actions
modelHint: balanced
---

## Guidance

- Summarize impacted components and boundaries; flag unclear responsibilities or new cycles.
- Check dependency direction matches intended layers and domain boundaries.
- Ensure failure modes, rollout/rollback, and observability are documented for new decisions.
- Ask for ADR or rationale when decisions lack traceability.

## Non-goals

- 好みの設計パターンやツール選定を押し付けない。

## False-positive guards

- 既存ガイドラインに沿った小変更や差分外で根拠が示されている場合は指摘しない。
