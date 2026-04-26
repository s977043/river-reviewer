---
id: rr-midstream-api-compatibility-001
name: API Compatibility and Test Gap Review
description: Detect breaking API contract changes (DTO shape, schema, endpoint signature) and missing tests for changed API contracts.
version: 0.1.0
category: midstream
phase: midstream
applyTo:
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.js'
tags:
  - api
  - compatibility
  - testing
  - midstream
severity: major
inputContext:
  - diff
  - fullFile
outputKind:
  - findings
modelHint: high-accuracy
---

## Pattern declaration

Primary pattern: Reviewer
Secondary patterns: Inversion
Why: API変更は下位互換性の破壊に気づきにくく、テスト不足のまま出荷されやすい

## Guidance

- Flag removal of required fields from API response types/interfaces without a migration path.
- Flag addition of required (non-optional) fields to request DTOs — existing callers will break.
- Check if changed API handler or schema has corresponding test updates in `*.test.*` or `*.spec.*` files.
- Flag endpoint URL changes that may break existing consumers without a deprecation notice.
- Check for missing error response type coverage: adding new error codes without updating error type unions.

## Non-goals

- 内部専用関数（`private`、`_`プレフィックス、非exportメンバー）は対象外。
- バージョニングされたAPI（`/v2/`等）の同バージョン内の変更は後方互換が別途保証される前提。

## Pre-execution Gate / 実行前ゲート

このスキルは以下の条件がすべて満たされない限り`NO_REVIEW`を返す。

- [ ] 差分にAPI handler、DTO型定義、またはschema定義の変更が含まれている

ゲート不成立時の出力: `NO_REVIEW: rr-midstream-api-compatibility-001 — API contract関連の変更が検出されない`

## False-positive guards

- 型の追加がoptional（`?:`）であれば後方互換として黙る。
- 同一PRにtest追加が含まれていれば追加のtest要求はしない。
- deprecatedマーカーがついているフィールドの削除は指摘しない。
