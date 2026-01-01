---
id: agent-webapp-testing
name: Web App Testing (Playwright)
description: Playwright でローカル/プレビュー環境の Web アプリを操作・検証するための手順をまとめる。
phase: downstream
applyTo:
  - 'apps/**/*.{ts,tsx,js,jsx}'
  - 'web/**/*.{ts,tsx,js,jsx}'
  - 'src/**/*.{ts,tsx,js,jsx}'
  - '**/*.spec.{ts,tsx,js,jsx}'
tags:
  - agent
  - testing
  - playwright
  - webapp
severity: major
inputContext:
  - diff
outputKind:
  - actions
  - findings
modelHint: balanced
---

## Guidance

- Outline key UI flows to automate with Playwright and prefer role/test-id selectors.
- Use shared fixtures for auth/setup and avoid fixed waits by asserting expected states.
- Suggest mocking external APIs when needed and enabling traces for debugging.
- Keep the regression suite lean with cleanup to avoid data pollution.

## Non-goals

- 実運用と無関係なデモ値や認証情報の埋め込みを勧めない。

## False-positive guards

- 既に安定した E2E 基盤があり変更が非 UI 設定のみなら指摘しない。
