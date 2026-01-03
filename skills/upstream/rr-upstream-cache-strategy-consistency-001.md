---
id: rr-upstream-cache-strategy-consistency-001
name: Cache Strategy Consistency Guard
description: Detect undefined or inconsistent cache strategies (layers, consistency, invalidation, TTL, failure handling) in design documents.
version: 0.1.0
phase: upstream
applyTo:
  - 'docs/**/*.md'
  - 'design/**/*.md'
  - 'specs/**/*.md'
  - 'rfc/**/*.md'
  - '**/*design*.md'
  - '**/*spec*.md'
  - '**/*architecture*.md'
tags:
  - cache
  - consistency
  - architecture
  - upstream
  - design-review
severity: minor
inputContext:
  - diff
outputKind:
  - findings
  - actions
modelHint: balanced
---

## Guidance

- Confirm cache layers (CDN/app/DB) and cache keys are specified with owners.
- Check consistency and invalidation strategy per layer, including TTL and refresh triggers.
- Ask for failure/backup behaviour when cache is stale or unavailable.
- Ensure the cache plan aligns with the source of truth and expected SLA.

## Non-goals

- キャッシュ実装の好み（ライブラリ選定など）を推測で押し付けない。

## False-positive guards

- 既に整合性・無効化・TTL が別ドキュメントで明示されている場合や差分が非キャッシュ領域のみなら指摘しない。
