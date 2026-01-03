---
id: rr-upstream-security-privacy-design-001
name: Security & Privacy Design Review
description: Review data retention, deletion, backup residency, and cross-border data transfer.
version: 0.1.0
phase: upstream
applyTo:
  - '**/*.md'
  - '**/design/**/*'
  - '**/rfc/**/*'
tags:
  - security
  - privacy
  - upstream
  - design
  - gdpr
  - pii
severity: minor
inputContext:
  - fullFile
outputKind:
  - findings
  - actions
modelHint: balanced
dependencies:
  - code_search
---

## Guidance

- Check retention/deletion policies, including backups, residency, and cross-border handling.
- Ensure privacy rights flows (erasure/export) and audit logging are defined with access controls.
- Verify encryption and access control strategy for data at rest/in transit.
- Call out missing threat/abuse considerations for sensitive data paths.

## Non-goals

- 実装詳細や規約の推測だけで断定しない。

## False-positive guards

- 別文書で保持/削除/暗号化ポリシーが明示されている場合や差分が非データ領域のみなら黙る。
