---
id: agent-code-review
name: Code Review (Multi-perspective)
description: PR 向けの自動コードレビュー。セキュリティ・性能・品質・テスト観点で差分を評価する。
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
  - review
  - security
  - performance
  - quality
severity: major
inputContext:
  - diff
outputKind:
  - findings
  - actions
modelHint: balanced
---

## Guidance

- Scan the diff for security risks (injection/auth), performance hotspots, and risky coupling.
- Ensure behaviour changes have tests and consistent error handling/logging with evidence.
- Prioritize high-impact findings; include file:line, rationale, and actionable fixes.
- Note positives briefly when they clarify intent or testing.

## Non-goals

- プロジェクト文脈が不足する推測や好みのスタイル強制は避ける。

## False-positive guards

- 変更がコメント/フォーマットのみや既存ポリシーに沿う場合は指摘しない。
