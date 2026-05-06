---
id: rr-upstream-spec-to-review-properties-001
name: Spec to Review Properties
description: Extract typed review properties from specs, ADRs, requirements, and API contracts for property-grounded review.
version: 0.1.0
category: upstream
phase: upstream
applyTo:
  - 'docs/**/*'
  - 'pages/**/*'
  - '**/*adr*.md'
  - '**/*spec*.md'
  - '**/*requirements*.md'
  - '**/*openapi*.{yaml,yml,json}'
  - '**/*schema*.{yaml,yml,json}'
tags:
  - security
  - specification
  - property-grounded-review
  - upstream
severity: major
inputContext:
  - diff
  - adr
  - repoConfig
outputKind:
  - summary
  - actions
  - questions
modelHint: high-accuracy
dependencies:
  - adr_lookup
  - repo_metadata
priority: 30
---

## Pattern declaration

Primary pattern: Generator
Secondary patterns: Pipeline / Inversion
Why: 仕様差分から後続レビューで使える型付きプロパティを生成し、証拠不足の場合は質問へ戻す必要がある。

## Goal / 目的

- 仕様・ADR・要件・API契約から、実装レビューに使える `ReviewProperty` を抽出する。
- 自然言語の曖昧な要件を、Invariant / Precondition / Postcondition / Assumption に分類して後続の proof-attempt review に渡す。

## Non-goals / 扱わないこと

- 実装コードの脆弱性をこのスキル内で断定しない。
- 仕様に書かれていない暗黙要件を新しいプロパティとして捏造しない。
- DeFi、Ethereum、特定コンテストのseverity基準を汎用プロジェクトへ持ち込まない。

## Pre-execution Gate / 実行前ゲート

このスキルは以下の条件がすべて満たされない限り `NO_REVIEW` を返す。

- [ ] 差分に仕様、ADR、要件、API契約、schema、設計ドキュメントの変更が含まれている
- [ ] inputContext に diff が含まれている
- [ ] 後続レビューで検証できる振る舞い、境界、制約、前提のいずれかが記述されている

ゲート不成立時の出力: `NO_REVIEW: rr-upstream-spec-to-review-properties-001 — 型付きレビュー対象の仕様差分がない`

## False-positive guards / 抑制条件

- 例、背景説明、将来構想、未決事項を確定プロパティとして出力しない。
- “should consider” “may” “TBD” など未確定表現は Assumption ではなく質問へ回す。
- 差分外の既存仕様を根拠に、新規プロパティを増やさない。

## Rule / ルール

各仕様文を次の型に分類する。

- `invariant`: 常に守られるべき状態・境界・整合性。例: tenant A cannot read tenant B data.
- `precondition`: 処理前に満たすべき条件。例: request must be authenticated before mutation.
- `postcondition`: 処理後に成立すべき結果。例: old refresh token is revoked after rotation.
- `assumption`: 設計や運用の前提。例: internal scheduler is trusted.

分類できない場合は無理に生成せず、質問として返す。

## Evidence / 根拠の取り方

- 各プロパティは必ず `source.path` と可能なら `section` または行番号へ紐づける。
- `statement` は仕様文から直接導ける内容に限定する。
- `formal_hint` は疑似形式でよいが、実装に対して証明試行できる形にする。
- security関連プロパティでは、可能なら STRIDE と CWE を補助分類として付ける。

## Output / 出力

すべて日本語。通常コメントではなく、後続工程に渡せる構造化候補として出力する。

1. 先頭に要約を1行で出す。
2. 次に `ReviewProperty` 候補を JSON 配列で出す。
3. 仕様が曖昧な場合は `questions` を出す。

JSON は `schemas/review-property.schema.json` に合わせる。

例:

```json
[
  {
    "property_id": "RR-PROP-auth-post-001",
    "type": "postcondition",
    "statement": "Refresh token rotation must invalidate the previous refresh token.",
    "formal_hint": "after rotate(old_token), old_token.status == revoked",
    "source": {
      "type": "adr",
      "path": "docs/adr/001-auth.md",
      "section": "Token rotation"
    },
    "phase": "upstream",
    "severity": "major",
    "confidence": "high",
    "scope": "in_scope",
    "threat_model": {
      "stride": ["elevation_of_privilege"],
      "cwe": ["CWE-287"]
    }
  }
]
```

## Evaluation / 評価指標

- 合格基準: 仕様差分に根拠を持つ、型付きで証明試行可能なプロパティが生成される。
- 不合格基準: 仕様にない要件の捏造、差分外の論点追加、一般的なセキュリティ助言だけの出力。

## Human Handoff / 人間に返す条件

- 仕様の文言が義務なのか例示なのか判別できない場合。
- trust boundary や scope が `.river/review-scope.json` なしでは判断できない場合。
- severity分類がプロダクト判断に依存する場合。
