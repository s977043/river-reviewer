---
id: agent-test-coverage
name: Test Coverage
description: 変更に対するテスト不足を検知し、最低限の補完方針を提示する。
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
outputKind:
  - actions
  - findings
modelHint: balanced
---

## Guidance

- Summarize behaviour changes and check matching unit/e2e tests exist.
- Flag untested branches, error paths, and regression fixes; suggest minimal cases.
- Ensure fixtures/helpers keep tests independent and cleanup is present.
- Prefer covering high-risk inputs over exhaustive enumerations.

## Non-goals

- テスト戦略全体の再設計を強要しない。

## False-positive guards

- 既存テストが同じ経路をカバーしていると確認できる場合は指摘しない。
