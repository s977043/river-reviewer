---
id: agent-agentcheck-code-review
name: AgentCheck Code Review
description: AgentCheck ベースでローカルリポジトリを走査し、PR 前のコードレビューを実行するスキル。
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
  - automation
  - review
severity: major
inputContext:
  - diff
  - fullFile
outputKind:
  - findings
  - actions
modelHint: balanced
---

## Guidance

- Use AgentCheck rules to scan high-impact files first and classify findings by severity with file:line.
- Focus on security, performance, and readability issues that fit River Reviewer outputs.
- Provide concise Why/Fix with actionable steps and avoid flooding with nits.
- Surface setup limits or areas needing project-specific rules.

## Non-goals

- 既存 linter と重複する軽微な指摘の乱発は避ける。

## False-positive guards

- 変更が無い領域や設定でスキャン対象外と明記されている箇所は報告しない。
