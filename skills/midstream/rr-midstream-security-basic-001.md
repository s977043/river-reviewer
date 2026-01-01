---
id: rr-midstream-security-basic-001
name: Baseline Security Checks
description: Check common security risks in application code (SQLi, XSS, secrets).
version: 0.1.0
phase: midstream
applyTo:
  - '**/{api,routes,db,ui,components,auth,security,config}/**/*.{ts,tsx,js,jsx}'
tags:
  - security
  - midstream
  - web
severity: major
inputContext:
  - diff
outputKind:
  - findings
  - actions
modelHint: balanced
dependencies:
  - code_search
---

## Guidance

- Look for string-concatenated queries or unsafe ORM calls; require parameterization.
- Flag unescaped HTML sinks (`dangerouslySetInnerHTML`/`innerHTML`) and missing sanitization.
- Catch secrets or tokens hardcoded in code; prefer environment/config inputs.
- Ensure input validation and authz/CSRF/error handling paths exist without leaking sensitive detail.

## Non-goals

- テスト用ダミー値や意図された緩和を推測で脆弱と決めつけない。

## False-positive guards

- 環境変数経由や既存バリデーションが確認できる場合、または diff がテスト/fixtures だけの場合は黙る。
