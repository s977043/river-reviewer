---
id: rr-midstream-logging-observability-001
name: Logging and Observability Guard
description: Ensure code changes keep logs/metrics/traces useful for debugging failures and regressions.
version: 0.1.0
phase: midstream
applyTo:
  - 'src/**/*'
  - 'lib/**/*'
  - '**/*.js'
  - '**/*.mjs'
  - '**/*.ts'
  - '**/*.tsx'
tags:
  - observability
  - logging
  - reliability
  - midstream
severity: minor
inputContext:
  - diff
outputKind:
  - findings
  - actions
modelHint: balanced
dependencies:
  - tracing
  - code_search
---

## Guidance

- Flag swallowed exceptions or catch blocks without logging/propagation.
- Require structured logs/metrics/traces with request IDs and minimal PII on new error paths.
- Ensure retries/fallbacks/cache branches emit signals for hit/miss/attempt counts.
- Highlight noisy or contextless logs that hinder debugging.

## Non-goals

- ログ基盤の選定や詳細設計の議論は避ける。

## False-positive guards

- テスト用の意図的な無視や既に文脈付きで再 throw している場合は指摘しない。
