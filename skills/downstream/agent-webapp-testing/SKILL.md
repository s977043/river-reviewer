---
id: agent-webapp-testing
name: Web App Testing (Playwright)
description: Playwright でローカル/プレビュー環境の Web アプリを操作・検証するための手順をまとめる。
version: 0.1.0
category: downstream
phase: downstream
applyTo:
  - 'apps/**/*.{ts,tsx,js,jsx}'
  - 'web/**/*.{ts,tsx,js,jsx}'
  - 'src/**/*.{ts,tsx,js,jsx}'
  - '**/*.spec.{ts,tsx,js,jsx}'
tags:
  - review-support
  - agent
  - testing
  - playwright
  - webapp
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
Why: Playwright でローカル/プレビュー環境の Web アプリを操作・検証するための手順をまとめる。

## Goal / 目的

- Playwright でローカル/プレビュー環境の Web アプリを操作・検証するための手順をまとめる。
- 既存の方針に沿った差分は追加コストなく通し、領域固有の高シグナル指摘のみ返す。

## Pre-execution Gate / 実行前ゲート

- 差分が `src/**/*.{ts,tsx,js,jsx}` または `tests/**/*` の web 関連いずれか に該当する場合のみ起動する。
- 差分がドキュメント/フィクスチャのみで本スキルの対象範囲外の場合は `NO_REVIEW: agent-webapp-testing — 対象差分なし` を返す。

## Guidance

- Outline key UI flows to automate with Playwright and prefer role/test-id selectors.
- Use shared fixtures for auth/setup and avoid fixed waits by asserting expected states.
- Suggest mocking external APIs when needed and enabling traces for debugging.
- Keep the regression suite lean with cleanup to avoid data pollution.

## Non-goals

- 実運用と無関係なデモ値や認証情報の埋め込みを勧めない。

## False-positive guards

- 既に安定した E2E 基盤があり変更が非 UI 設定のみなら指摘しない。

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
