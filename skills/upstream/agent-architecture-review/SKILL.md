---
id: agent-architecture-review
name: Architecture Review
description: 変更の全体設計、責務分離、境界の破綻を検知するためのレビュー手順。
version: 0.1.0
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

## Pattern declaration

Primary pattern: Reviewer
Secondary patterns: Inversion
Why: 変更の全体設計、責務分離、境界の破綻を検知するためのレビュー手順。

## Goal / 目的

- 変更の全体設計、責務分離、境界の破綻を検知するためのレビュー手順。
- 既存の方針に沿った差分は追加コストなく通し、領域固有の高シグナル指摘のみ返す。

## Pre-execution Gate / 実行前ゲート

- 差分が `docs/architecture/**/*.md` / `docs/adr/**/*` / `pages/**/*architecture*.md` / `**/*.adr` のいずれか に該当する場合のみ起動する。
- 差分がドキュメント/フィクスチャのみで本スキルの対象範囲外の場合は `NO_REVIEW: agent-architecture-review — 対象差分なし` を返す。

## Guidance

- Summarize impacted components and boundaries; flag unclear responsibilities or new cycles.
- Check dependency direction matches intended layers and domain boundaries.
- Ensure failure modes, rollout/rollback, and observability are documented for new decisions.
- Ask for ADR or rationale when decisions lack traceability.

## Non-goals

- 好みの設計パターンやツール選定を押し付けない。

## False-positive guards

- 既存ガイドラインに沿った小変更や差分外で根拠が示されている場合は指摘しない。

## Output / 出力例

```yaml
findings:
  - severity: major
    file: <対象ファイル>
    line: <行番号>
    issue: <Goal で述べた観点に該当する問題の 1 文要約>
    suggestion: <次の最小一手>
actions: []
```

出力種別: findings / actions。Severity は本スキルの metadata 既定値（`major`）を上限とし、root cause を伴わないものは `info` に下げる。
