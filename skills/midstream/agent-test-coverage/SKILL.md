---
id: agent-test-coverage
name: Test Coverage
description: 変更に対するテスト不足を検知し、最低限の補完方針を提示する。
version: 0.1.0
category: midstream
phase: midstream
applyTo:
  - 'src/**/*'
  - 'lib/**/*'
  - '**/*.test.{ts,tsx,js,jsx}'
  - '**/*.spec.{ts,tsx,js,jsx}'
tags:
  - agent
  - testing
  - coverage
severity: major
inputContext:
  - diff
  - tests
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
Why: 変更に対するテスト不足を検知し、最低限の補完方針を提示する。

## Goal / 目的

- 変更に対するテスト不足を検知し、最低限の補完方針を提示する。
- 既存の方針に沿った差分は追加コストなく通し、領域固有の高シグナル指摘のみ返す。

## Pre-execution Gate / 実行前ゲート

- 差分が `src/**/*` / `app/**/*` の TS/JS、または `tests/**/*` の対応テストいずれか に該当する場合のみ起動する。
- 差分がドキュメント/フィクスチャのみで本スキルの対象範囲外の場合は `NO_REVIEW: agent-test-coverage — 対象差分なし` を返す。

## Guidance

- Summarize behaviour changes and check matching unit/e2e tests exist.
- Flag untested branches, error paths, and regression fixes; suggest minimal cases.
- Ensure fixtures/helpers keep tests independent and cleanup is present.
- Prefer covering high-risk inputs over exhaustive enumerations.

## Non-goals

- テスト戦略全体の再設計を強要しない。

## False-positive guards

- 既存テストが同じ経路をカバーしていると確認できる場合は指摘しない。

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

出力種別: actions / findings。Severity は本スキルの metadata 既定値（`major`）を上限とし、root cause を伴わないものは `info` に下げる。
