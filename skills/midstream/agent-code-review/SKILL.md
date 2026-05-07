---
id: agent-code-review
name: Code Review (Multi-perspective)
description: PR 向けの自動コードレビュー。セキュリティ・性能・品質・テスト観点で差分を評価する。
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
  - review
  - security
  - performance
  - quality
severity: major
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
Why: PR 向けの自動コードレビュー。セキュリティ・性能・品質・テスト観点で差分を評価する。

## Goal / 目的

- PR 向けの自動コードレビュー。セキュリティ・性能・品質・テスト観点で差分を評価する。
- 既存の方針に沿った差分は追加コストなく通し、領域固有の高シグナル指摘のみ返す。

## Pre-execution Gate / 実行前ゲート

- 差分が `src/**/*` / `app/**/*` / `lib/**/*` / `packages/**/*` の TS/JS いずれか に該当する場合のみ起動する。
- 差分がドキュメント/フィクスチャのみで本スキルの対象範囲外の場合は `NO_REVIEW: agent-code-review — 対象差分なし` を返す。

## Guidance

- Scan the diff for security risks (injection/auth), performance hotspots, and risky coupling.
- Ensure behaviour changes have tests and consistent error handling/logging with evidence.
- Prioritize high-impact findings; include file:line, rationale, and actionable fixes.
- Note positives briefly when they clarify intent or testing.

## Non-goals

- プロジェクト文脈が不足する推測や好みのスタイル強制は避ける。

## False-positive guards

- 変更がコメント/フォーマットのみや既存ポリシーに沿う場合は指摘しない。

## Execution Strategy / 実行戦略

### 観点の実行順序

以下の順で差分を走査する。各観点は独立して実行し、findingsを統合する。

| 順序 | 観点           | 打ち切り条件                                                         |
| ---- | -------------- | -------------------------------------------------------------------- |
| 1    | セキュリティ   | Critical finding検出時: 以降の観点も実行するが、Criticalを先頭に出力 |
| 2    | パフォーマンス | ホットパス外の変更のみの場合はスキップ可                             |
| 3    | 品質・設計     | 常に実行                                                             |
| 4    | テスト網羅性   | テストファイルが差分に含まれない場合も、対象コードのテスト有無を確認 |

### 出力テンプレート

各観点のfindingは以下の統一構造で出力する:

```text
<file>:<line>: [<観点>/<severity>] <Finding 1文>
  Impact: <影響の説明>
  Fix: <最小の修正案>
```

観点ラベル: `security` / `performance` / `quality` / `testing`

### 観点間の重要度比較

異なる観点のfindingsが同一箇所を指す場合:

- severityが異なる → 高い方を採用し、もう一方は補足として併記
- severityが同じ → security > performance > quality > testing の順で先に記載

### 出力件数の制約

- 1 PRあたり最大15件。超過する場合はseverity降順で切り捨て、切り捨て件数を末尾に記載
- 同一ファイルへの同一観点の指摘は最大3件にグルーピング

## Heuristics / 判定の手がかり

- `catch`ブロック内の空文、`// TODO` → security / quality
- `O(n*m)`パターン、ループ内のDB/APIコール → performance
- `any`型、型アサーション(`as`)、未使用import → quality
- 新規export関数にテストファイル内の対応する`describe`/`test`がない → testing

## Output / 出力例

```yaml
findings:
  - severity: major
    file: <対象ファイル>
    line: <行番号>
    issue: <Goal で述べた観点に該当する問題の 1 文要約>
    suggestion: <次の最小一手>
actions: []
```

出力種別: findings / actions。Severity は本スキルの metadata 既定値（`major`）を上限とし、root cause を伴わないものは `info` に下げる。
