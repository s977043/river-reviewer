---
id: agent-agentcheck-code-review
name: AgentCheck Code Review
description: AgentCheck ベースでローカルリポジトリを走査し、PR 前のコードレビューを実行するスキル。
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
dependencies:
  - code_search
---

## Pattern declaration

Primary pattern: Reviewer
Secondary patterns: Inversion
Why: AgentCheck ベースでローカルリポジトリを走査し、PR 前のコードレビューを実行するスキル。

## Goal / 目的

- AgentCheck ベースでローカルリポジトリを走査し、PR 前のコードレビューを実行するスキル。
- 既存の方針に沿った差分は追加コストなく通し、領域固有の高シグナル指摘のみ返す。

## Pre-execution Gate / 実行前ゲート

- 差分が `src/**/*` / `app/**/*` / `lib/**/*` / `packages/**/*` の TS/JS いずれか に該当する場合のみ起動する。
- 差分がドキュメント/フィクスチャのみで本スキルの対象範囲外の場合は `NO_REVIEW: agent-agentcheck-code-review — 対象差分なし` を返す。

## Guidance

- Use AgentCheck rules to scan high-impact files first and classify findings by severity with file:line.
- Focus on security, performance, and readability issues that fit River Review outputs.
- Provide concise Why/Fix with actionable steps and avoid flooding with nits.
- Surface setup limits or areas needing project-specific rules.

## Non-goals

- 既存 linter と重複する軽微な指摘の乱発は避ける。

## False-positive guards

- 変更が無い領域や設定でスキャン対象外と明記されている箇所は報告しない。

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

出力種別: findings / actions。Severity は本スキルの metadata 既定値（`major`）を上限とし、root cause を伴わないものは `info` に下げる。
