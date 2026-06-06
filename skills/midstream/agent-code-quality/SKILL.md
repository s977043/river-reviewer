---
id: agent-code-quality
name: Code Quality
description: 可読性と保守性を中心に、コード品質の基本的な劣化を検知する。
version: 0.1.0
category: midstream
phase: midstream
applyTo:
  - 'src/**/*'
  - 'lib/**/*'
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.js'
  - '**/*.jsx'
tags:
  - agent
  - quality
  - readability
severity: minor
inputContext:
  - diff
outputKind:
  - findings
  - actions
modelHint: balanced
---

## Pattern declaration

Primary pattern: Reviewer
Secondary patterns: Inversion
Why: 可読性と保守性を中心に、コード品質の基本的な劣化を検知する。

## Goal / 目的

- 可読性と保守性を中心に、コード品質の基本的な劣化を検知する。
- 既存の方針に沿った差分は追加コストなく通し、領域固有の高シグナル指摘のみ返す。

## Pre-execution Gate / 実行前ゲート

- 差分が `src/**/*` / `app/**/*` / `lib/**/*` / `packages/**/*` の TS/JS いずれか に該当する場合のみ起動する。
- 差分がドキュメント/フィクスチャのみで本スキルの対象範囲外の場合は `NO_REVIEW: agent-code-quality — 対象差分なし` を返す。

## Guidance

- Check names and boundaries keep responsibilities clear; flatten deep nesting with guard clauses.
- Flag names too broad to convey intent (`data`, `info`, `manager`, `handler`, `util`, `current`), unshared abbreviations, and the same concept named differently (or different concepts sharing a name).
- Flag encapsulation leaks: code that reaches deep into an object's internals (`a.b.c.type === 'x'`), pulls a primitive out of a value object to branch on it externally, or exposes internal state through getters. Prefer Tell-Don't-Ask (e.g. `user.isPremium()` over `user.subscription.plan.type === 'premium'`), which also hides the `subscription` structure from the caller (Law of Demeter).
- Spot duplicated logic or unclear error handling/logging that harms readability.
- Recommend small refactors that improve clarity without changing behaviour.
- Prefer consistency with surrounding patterns instead of new conventions.

## Non-goals

- 個人の好みや微細なスタイル差のみで指摘しない。
- 型/値オブジェクトの設計（primitive obsession・brand 型・discriminated union）は `rr-midstream-type-driven-design-001` に委譲する。
- null/undefined 契約は `rr-midstream-typescript-nullcheck-001`、例外の握りつぶし検出は `rr-midstream-logging-observability-001` に委譲する。

## False-positive guards

- フォーマット変更や既に周辺と一貫している命名の場合は黙る。

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

出力種別: findings / actions。Severity は本スキルの metadata 既定値（`minor`）を上限とし、root cause を伴わないものは `info` に下げる。
