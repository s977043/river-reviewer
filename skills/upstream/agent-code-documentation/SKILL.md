---
id: agent-code-documentation
name: Code Documentation
description: コードや API の意図を短時間で共有できるドキュメントの書き方をガイドする。
version: 0.1.0
category: upstream
phase: upstream
applyTo:
  - 'docs/**/*'
  - 'pages/**/*'
  - 'README*.md'
  - 'README*.markdown'
  - '**/README.md'
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
dependencies:
  - code_search
---

## Pattern declaration

Primary pattern: Reviewer
Secondary patterns: Inversion
Why: コードや API の意図を短時間で共有できるドキュメントの書き方をガイドする。

## Goal / 目的

- コードや API の意図を短時間で共有できるドキュメントの書き方をガイドする。
- 既存の方針に沿った差分は追加コストなく通し、領域固有の高シグナル指摘のみ返す。

## Pre-execution Gate / 実行前ゲート

- 差分が `docs/**/*` / `pages/**/*` / `README*.md` のいずれか に該当する場合のみ起動する。
- 差分がドキュメント/フィクスチャのみで本スキルの対象範囲外の場合は `NO_REVIEW: agent-code-documentation — 対象差分なし` を返す。

## Guidance

- Clarify audience and purpose first; provide runnable quickstart/usage with dummy secrets.
- Document APIs with signature, params, returns, errors, and at least one verified example.
- Explain “why” in inline comments for non-obvious rules; avoid restating the code.
- Run lint/build on snippets so docs stay executable.

## Non-goals

- プロジェクト方針と無関係な構成強制や実データの記載は避ける。

## False-positive guards

- 既に最新の README/ドキュメントで目的と手順が明確な場合は指摘しない。

## Output / 出力例

```yaml
findings:
  - severity: minor
    file: <対象ファイル>
    line: <行番号>
    issue: <Goal で述べた観点に該当する問題の 1 文要約>
    suggestion: <次の最小一手>
actions: []
```

出力種別: actions / findings。Severity は本スキルの metadata 既定値（`minor`）を上限とし、root cause を伴わないものは `info` に下げる。
