---
id: agent-qa-regression
name: QA Regression (Playwright)
description: Playwright を使った回帰テストの設計と実行をガイドする。
phase: downstream
applyTo:
  - 'tests/e2e/**/*'
  - 'e2e/**/*'
  - '**/*.spec.{ts,tsx,js,jsx}'
  - '**/*.test.{ts,tsx,js,jsx}'
tags:
  - agent
  - testing
  - regression
  - playwright
severity: major
inputContext:
  - diff
outputKind:
  - actions
  - findings
modelHint: balanced
---

## Guidance

- Ensure critical flows (auth/dashboard/CRUD) have regression specs for success and failure cases.
- Use shared login/setup helpers and stable selectors to keep Playwright runs reliable.
- Recommend traces/screenshots for flaky areas and cleanup to keep test data isolated.
- Prioritize a smoke suite for release gates before the full regression run.

## Non-goals

- 単なるツール導入手順の繰り返しや網羅的テスト要求は避ける。

## False-positive guards

- 既存の回帰スイートが同フローをカバーし、変更が文書のみなら指摘しない。
