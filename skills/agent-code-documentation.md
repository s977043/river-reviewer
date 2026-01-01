---
id: agent-code-documentation
name: Code Documentation
description: コードや API の意図を短時間で共有できるドキュメントの書き方をガイドする。
phase: upstream
applyTo:
  - 'docs/**/*'
  - 'pages/**/*'
  - '**/*.md'
  - 'README*.md'
tags:
  - agent
  - documentation
severity: minor
inputContext:
  - fullFile
outputKind:
  - actions
  - findings
modelHint: balanced
---

## Guidance

- Clarify audience and purpose first; provide runnable quickstart/usage with dummy secrets.
- Document APIs with signature, params, returns, errors, and at least one verified example.
- Explain “why” in inline comments for non-obvious rules; avoid restating the code.
- Run lint/build on snippets so docs stay executable.

## Non-goals

- プロジェクト方針と無関係な構成強制や実データの記載は避ける。

## False-positive guards

- 既に最新の README/ドキュメントで目的と手順が明確な場合は指摘しない。
