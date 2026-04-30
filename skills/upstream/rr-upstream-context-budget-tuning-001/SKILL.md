---
id: rr-upstream-context-budget-tuning-001
name: 'Context Budget Tuning'
description: '.river-reviewer.{yaml,json} の context.budget / ranking / reviewMode 設定をモデル仕様とリポジトリ規模に合わせて調整するレビュー観点。'
version: 0.1.0
category: upstream
phase: upstream
applyTo:
  - '.river-reviewer.yaml'
  - '.river-reviewer.yml'
  - '.river-reviewer.json'
  - '.river-reviewer/**/*.{yaml,yml,json}'
inputContext:
  - diff
  - repoConfig
outputKind:
  - findings
  - actions
modelHint: balanced
tags:
  - configuration
  - context
  - process
  - upstream
severity: minor
---

## Pattern declaration

Primary pattern: Reviewer
Secondary patterns: Tool Wrapper
Why: `.river-reviewer` の context 設定変更時に、reviewMode プリセット選択 / token・char 上限 / ranking weights をモデル仕様と照合してレビューする educator スキル。

## Goal / 目的

- `.river-reviewer.{yaml,json}` の `context.reviewMode` / `context.budget` / `context.ranking` 変更が **モデル仕様 (`model.modelName`) と整合しているか** をレビューで確認する。
- `reviewMode: tiny | medium | large` プリセットの **既定値 (1024 / 4000 / 16000 max tokens)** と explicit `budget` の優先関係を理解させる。
- ranking weights (`pathProximity` / `symbolUsage` / `siblingTest` / `commitRecency`) の **0.0〜1.0 範囲** とスキーマキー名を schema (`src/config/schema.mjs`) と照合する。

## Guidance

### reviewMode プリセット既定値 (`src/lib/context-presets.mjs`)

| reviewMode | maxTokens 既定 | 想定モデル                             |
| ---------- | -------------- | -------------------------------------- |
| `tiny`     | 1024           | コンテキスト窓の小さいモデル / 短い PR |
| `medium`   | 4000           | gpt-4o-mini / sonnet 級モデルの通常 PR |
| `large`    | 16000          | 大型モデルでの深掘りレビュー           |

- 明示的 `context.budget` がある場合は **常に preset より優先** する。
- `budget.maxTokens` の上限は schema で `64000`、`maxChars` は `200000` まで。

### モデル仕様との整合チェック

- `context.budget.maxTokens` が `model.modelName` の effective context window を超えていないか。`gpt-4o-mini` で `maxTokens: 16000` のような過大設定はコスト増・効果的窓外切捨ての両面で非効率。
- 逆に `large` プリセットを `gpt-4o-mini` に当てると **prompt 後段が打ち切られて redundant** になる。中型モデル以上を想定する。

### ranking weights のレビュー

- キーは schema 定義 (`pathProximity` / `symbolUsage` / `siblingTest` / `commitRecency`) と一致しなければならない。古い名称（`symbolOverlap` / `testAffinity`）は **#728 で廃止済み**。
- 各 weight は `0.0`〜`1.0`。合計が 1 を超えても問題ないが、`scoreContextCandidate` が weighted average を取るため相対比のみが意味を持つ。

### perSectionCaps の整合

- `budget.perSectionCaps` (`fullFile` / `tests` / `usages` / `config`) は char 単位。各 cap と `budget.maxChars`、token budget の **min** が実効値。
- セクション別 cap を 0 に設定すると当該セクションが収集対象から外れる。意図的な省略でなければ警告。

## Non-goals / 扱わないこと

- ranking weights の最適値そのものの探索（プロジェクト固有）。
- `context.budget` を使わない運用判断（CI 環境差異など）。
- 個別 PR レビューで実際に消費されたトークン量の検証 (それは `reviewDebug.repoContextBudget` の観測責務)。

## Pre-execution Gate / 実行前ゲート

このスキルは以下のいずれかが満たされない限り `NO_REVIEW` を返す。

- [ ] 差分に `.river-reviewer.{yaml,yml,json}` または `.river-reviewer/` 配下の設定変更が含まれている
- [ ] 変更が `context.budget` / `context.ranking` / `context.reviewMode` のいずれかに触れている

ゲート不成立時の出力: `NO_REVIEW: rr-upstream-context-budget-tuning-001 — context.* 設定の変更が検出されない`

## False-positive guards / 抑制条件

- `context.budget` も `context.ranking` も `context.reviewMode` も触れていない `.river-reviewer.*` 変更（model 設定や exclude のみの変更）では指摘しない。
- ranking weights の値が schema 範囲内 (`0.0`〜`1.0`) で、合計が 1 でなくとも relative ratio として正しければ指摘しない (合計 1 制約は schema にない)。
- `reviewMode` を tiny にして budget を明示しないケースを「budget 不足」と誤認しない（preset がカバーしている）。

## Output / 出力例

```yaml
findings:
  - severity: minor
    file: .river-reviewer.yaml
    line: 18
    issue: |
      `reviewMode: large` (preset maxTokens 16000) を `model.modelName: gpt-4o-mini`
      と組み合わせています。gpt-4o-mini の effective context window は 8000〜10000 token のため、
      末尾の context が打ち切られ redundant になります。
    suggestion: |
      `reviewMode: medium` (preset maxTokens 4000) で十分です。
      depth が必要な場合は `context.ranking.enabled: true` で近接度の高い候補を
      優先させ、weights を `pathProximity: 0.5, symbolUsage: 0.3` 等に調整してください。
  - severity: minor
    file: .river-reviewer.yaml
    line: 24
    issue: |
      `context.ranking.weights.symbolOverlap` を指定しています。
      schema (`src/config/schema.mjs` `contextRankingSchema`) のキーは `symbolUsage` です
      (#728 でリネーム済み)。現状のキーは silently 無視されます。
    suggestion: |
      `symbolOverlap` → `symbolUsage`、`testAffinity` → `siblingTest` にリネームしてください。
actions:
  - type: 'verify'
    description: 'PR 後の review で `reviewDebug.repoContextBudget.remaining` が 0 / 過大に余っていないかを観測する'
```
