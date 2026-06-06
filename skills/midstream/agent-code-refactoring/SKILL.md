---
id: agent-code-refactoring
name: Code Refactoring
description: 挙動を変えずに設計を整えるためのリファクタリング手順をガイドする。
version: 0.1.0
category: midstream
phase: midstream
applyTo:
  - 'src/**/*'
  - 'lib/**/*'
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.js'
  - '**/*.jsx'
tags:
  - agent
  - refactoring
  - maintainability
severity: minor
inputContext:
  - diff
  - fullFile
outputKind:
  - actions
  - findings
modelHint: balanced
dependencies:
  - code_search
---

## Pattern declaration

Primary pattern: Reviewer
Secondary patterns: Inversion
Why: 挙動を変えずに設計を整えるためのリファクタリング手順をガイドする。

## Goal / 目的

- 挙動を変えずに設計を整えるためのリファクタリング手順をガイドする。
- 既存の方針に沿った差分は追加コストなく通し、領域固有の高シグナル指摘のみ返す。

## Pre-execution Gate / 実行前ゲート

- 差分が `src/**/*` / `app/**/*` / `lib/**/*` / `packages/**/*` の TS/JS いずれか に該当する場合のみ起動する。
- 差分がドキュメント/フィクスチャのみで本スキルの対象範囲外の場合は `NO_REVIEW: agent-code-refactoring — 対象差分なし` を返す。

## Guidance

- Plan safety nets (tests/smoke) before refactors; keep steps small and reversible.
- Extract focused functions/constants to reduce nesting and magic values without changing behaviour.
- Flag over-abstraction (the reverse of duplication): premature DRY that couples code with different reasons to change, unnecessary layers/indirection/delegation, and interfaces/generics introduced for a single current caller. Distinguish "same concept duplicated" from "coincidentally similar".
- Flag over-classification: a class/type where a function or plain data would be clearer, and speculative extensibility ("future-proofing") not needed by the current diff.
- Align error handling/logging with neighbours and rerun tests after each step.
- Call out areas needing tests before deeper refactors.

## Non-goals

- ビジネス仕様を変える提案や大規模再設計の押し付けは避ける。
- 概念モデリング・型設計は `rr-midstream-type-driven-design-001`、テスト安定性（I/O・日時・乱数依存）は `rr-downstream-flaky-test-001` に委譲する。

## False-positive guards

- 一時的コードや短命な実験ならコストに見合う最小の提案にとどめる。

## Output / 出力例

```yaml
findings:
  - severity: minor
    file: <対象ファイル>
    line: <行番号>
    issue: <Goal で述べた観点に該当する問題の 1 文要約>
    suggestion: <次の最小一手>
actions: []
```

出力種別: actions / findings。Severity は本スキルの metadata 既定値（`minor`）を上限とし、root cause を伴わないものは `info` に下げる。
