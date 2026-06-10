---
id: agent-qa-regression
name: QA Regression (Playwright)
description: Playwright を使った回帰テストの設計と実行をガイドする。
version: 0.1.0
category: downstream
phase: downstream
applyTo:
  - 'tests/e2e/**/*'
  - 'e2e/**/*'
  - '**/*.spec.{ts,tsx,js,jsx}'
  - '**/*.test.{ts,tsx,js,jsx}'
tags:
  - review-support
  - agent
  - testing
  - regression
  - playwright
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
Why: Playwright を使った回帰テストの設計と実行をガイドする。

## Goal / 目的

- Playwright を使った回帰テストの設計と実行をガイドする。
- 既存の方針に沿った差分は追加コストなく通し、領域固有の高シグナル指摘のみ返す。

## Pre-execution Gate / 実行前ゲート

- 差分が `tests/e2e/**/*` / `tests/**/*regression*` / `playwright.config.*` のいずれか に該当する場合のみ起動する。
- 差分がドキュメント/フィクスチャのみで本スキルの対象範囲外の場合は `NO_REVIEW: agent-qa-regression — 対象差分なし` を返す。

## Guidance

- Ensure critical flows (auth/dashboard/CRUD) have regression specs for success and failure cases.
- Use shared login/setup helpers and stable selectors to keep Playwright runs reliable.
- Recommend traces/screenshots for flaky areas and cleanup to keep test data isolated.
- Prioritize a smoke suite for release gates before the full regression run.

## Non-goals

- 単なるツール導入手順の繰り返しや網羅的テスト要求は避ける。

## False-positive guards

- 既存の回帰スイートが同フローをカバーし、変更が文書のみなら指摘しない。

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
