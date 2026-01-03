---
id: agent-code-refactoring
name: Code Refactoring
description: 挙動を変えずに設計を整えるためのリファクタリング手順をガイドする。
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
---

## Guidance

- Plan safety nets (tests/smoke) before refactors; keep steps small and reversible.
- Extract focused functions/constants to reduce nesting and magic values without changing behaviour.
- Align error handling/logging with neighbours and rerun tests after each step.
- Call out areas needing tests before deeper refactors.

## Non-goals

- ビジネス仕様を変える提案や大規模再設計の押し付けは避ける。

## False-positive guards

- 一時的コードや短命な実験ならコストに見合う最小の提案にとどめる。
