---
id: rr-upstream-multitenancy-isolation-001
name: Multitenancy Isolation Guard
description: マルチテナント前提の設計差分から、テナント分離（データ/権限/リソース/障害影響）の抜けや越境リスクを検出
version: 0.1.0
phase: upstream
applyTo:
  - '**/*.md'
  - '**/*.yaml'
  - '**/*.yml'
  - '**/*.json'
  - 'docs/**/*'
  - 'design/**/*'
  - 'architecture/**/*'
  - 'specs/**/*'
tags:
  - multitenancy
  - isolation
  - security
  - architecture
  - upstream
severity: major
inputContext:
  - fullFile
  - adr
outputKind:
  - findings
  - actions
modelHint: balanced
dependencies:
  - code_search
---

## Guidance

- Confirm tenant scoping for data paths (queries, cache keys, queues, storage).
- Check auth and authorization flows prevent cross-tenant access (IDOR, tenant headers).
- Call out noisy-neighbor risks: shared pools, rate limits, or job queues without fairness.
- Ensure failure isolation and observability are tenant-aware.

## Non-goals

- テナント以外の一般的な設計批評は避ける。

## False-positive guards

- 既に tenant_id フィルターや RLS/名前空間化が明示されている場合、差分外の記述のみでは指摘しない。
