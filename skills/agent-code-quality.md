---
id: agent-code-quality
name: Code Quality
description: 可読性と保守性を中心に、コード品質の基本的な劣化を検知する。
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
  - quality
  - readability
severity: minor
inputContext:
  - diff
outputKind:
  - findings
  - actions
modelHint: balanced
---

## Guidance

- Check names and boundaries keep responsibilities clear; flatten deep nesting with guard clauses.
- Spot duplicated logic or unclear error handling/logging that harms readability.
- Recommend small refactors that improve clarity without changing behaviour.
- Prefer consistency with surrounding patterns instead of new conventions.

## Non-goals

- 個人の好みや微細なスタイル差のみで指摘しない。

## False-positive guards

- フォーマット変更や既に周辺と一貫している命名の場合は黙る。
