---
id: rr-midstream-nullability-contract-001
name: Nullability Contract Review
description: Detect missing null/undefined/empty guards for API responses, DB results, form inputs, and external service data.
version: 0.1.0
category: midstream
phase: midstream
applyTo:
  - '**/*.ts'
  - '**/*.tsx'
tags:
  - nullability
  - type-safety
  - error-handling
  - midstream
severity: major
inputContext:
  - diff
outputKind:
  - findings
modelHint: balanced
---

## Pattern declaration

Primary pattern: Reviewer
Secondary patterns: Inversion
Why: null/undefined参照エラーは実行時に表面化し、型アノテーションだけでは防ぎにくい

## Guidance

- Flag direct property access on values from API responses without null guard: `data.user.name` without `if (!data.user)`.
- Flag non-null assertion (`!`) on values that could legitimately be null/undefined at runtime.
- Check optional chaining (`?.`) usage: if used inconsistently on the same object chain, flag the gaps.
- Flag array operations (`.map`, `.filter`, `.find`) on potentially undefined values without a guard.
- Check form input values: `event.target.value` or `req.body.field` accessed without validation.

## Non-goals

- 型システムで保証された non-nullable 値への指摘は行わない（`string` に `?.` を強制しない）。
- テストコードや型定義ファイル（`.d.ts`）は対象外。
- strictNullChecks が無効な場合は誤検知になるため、TypeScript strict mode 前提で判断する。

## Pre-execution Gate / 実行前ゲート

このスキルは以下の条件がすべて満たされない限り`NO_REVIEW`を返す。

- [ ] 差分にAPIレスポンス、DBクエリ結果、またはユーザー入力の処理コードが含まれている

ゲート不成立時の出力: `NO_REVIEW: rr-midstream-nullability-contract-001 — null/undefined契約に関連する変更が検出されない`

## False-positive guards

- TypeScriptの型定義で`NonNullable<T>`や`T & {}`として明示されている場合は黙る。
- Optional chainingが一貫して使用されている場合はOK。
