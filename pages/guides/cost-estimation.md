# コスト見積もりと最適化ガイド

このガイドは、river-review を導入する前に **チーム・プロジェクト単位の月額コスト** を試算し、運用開始後に **実測値で検証** するための手順をまとめたものです。`--estimate` と `--max-cost` の運用や、Issue [#803](https://github.com/s977043/river-review/issues/803) で議論された見積もり要求への回答にあたります。

> 価格は `src/core/cost-estimator.mjs` の `MODEL_PRICES` テーブルが正本（`PRICING_LAST_UPDATED` で最終更新日を確認できます）。プロバイダーの公式価格が変わったら同テーブルを更新してください。

## 1. コスト構造の概要

river-review の 1 回のレビューは「**スキル × 対象ファイル**」ごとに 1 度ずつ LLM API を呼び出します。コストは次の要素の合算です。

| 要素                  | 単価例（claude-sonnet-4-6）  | 説明                                                               |
| --------------------- | ---------------------------- | ------------------------------------------------------------------ |
| Fresh input tokens    | `$3.00 / 1M` (`0.003 / 1k`)  | プロンプトキャッシュにヒットしない入力。systemPrompt + diff + 文脈 |
| Cache read tokens     | `$0.30 / 1M` (`0.0003 / 1k`) | キャッシュから読まれた入力。**fresh の 1/10**                      |
| Cache write surcharge | `+25%` of input rate         | Anthropic 仕様。最初の 1 回のみ発生                                |
| Output tokens         | `$15.00 / 1M` (`0.015 / 1k`) | レビュー出力                                                       |

OpenAI 系（`gpt-4o-mini` など）も同じ構造ですが、cache read 単価は input の 50% です。

### 1 回の API call あたりの式

```text
USD = (fresh_input / 1000) * inputPer1k
    + (cache_read   / 1000) * cacheReadPer1k
    + (cache_create / 1000) * inputPer1k * 0.25   # Anthropic のみ
    + (output       / 1000) * outputPer1k
```

実装は `CostEstimator.estimateFromUsage(usage)` を参照してください。

## 2. シナリオ別の試算

数値は `src/core/cost-estimator.mjs` の現行 pricing table を前提にした **推定値** です。実環境では `RIVER_USAGE_TELEMETRY=1` を設定して [Section 4](#4-実測値の収集) の手順で実測値に置き換えてください。

### 2-1. 小規模 PR（diff 50 行 / midstream のみ / planner=off）

| 入力              | 値                                  |
| ----------------- | ----------------------------------- |
| diff トークン     | ~600（50 行 × 12 tokens 想定）      |
| 対象スキル数      | 5（midstream のセキュリティ系のみ） |
| 平均 systemPrompt | 800 tokens                          |
| 出力              | 平均 300 tokens / call              |
| モデル            | `claude-sonnet-4-6`                 |

**初回（キャッシュなし）の概算**:

```text
input  = (800 + 600) × 5 = 7,000
output = 300 × 5 = 1,500
USD    = 7,000/1000 × 0.003 + 1,500/1000 × 0.015 = $0.021 + $0.0225 = $0.0435
```

**2 回目以降（同一 skill systemPrompt がキャッシュヒット）**:

```text
fresh_input    = 600 × 5 = 3,000
cache_read     = 800 × 5 = 4,000
output         = 1,500
USD = 3,000/1000 × 0.003 + 4,000/1000 × 0.0003 + 1,500/1000 × 0.015
    = $0.009 + $0.0012 + $0.0225 = $0.0327  (約 25% 削減)
```

### 2-2. 中規模 PR（diff 300 行 / midstream + orchestrator 3 ロール並列）

| 入力                | 値                                          |
| ------------------- | ------------------------------------------- |
| diff トークン       | ~3,600                                      |
| 対象スキル数        | 8                                           |
| Orchestrator ロール | 3（bug-hunter, security-scanner, test-gap） |
| モデル              | `claude-sonnet-4-6`                         |

```text
calls = 8 (skills) × 3 (roles) = 24
input/call  = 800 (sys) + 3,600 (diff) = 4,400
output/call = 600 (中程度のレビュー)

# 全体 (キャッシュ無視)
input_total  = 24 × 4,400 = 105,600 tokens
output_total = 24 × 600 = 14,400 tokens
USD ≒ 105.6 × 0.003 + 14.4 × 0.015 = $0.317 + $0.216 = $0.533
```

`prompt caching` ON（デフォルト）で同じ systemPrompt が 24 回のうち 23 回ヒットすると仮定すると、**約 30-40% 削減** が期待できます。

### 2-3. 大規模 PR（diff 1000 行 / upstream + midstream / planner=prune）

| 入力          | 値                        |
| ------------- | ------------------------- |
| diff トークン | ~12,000                   |
| 対象スキル数  | 12（フェーズ横断）        |
| planner=prune | 関連スキル 5 つに絞り込み |
| モデル        | `claude-sonnet-4-6`       |

```text
calls (after prune) = 5
input/call  = 800 (sys) + 12,000 (diff) = 12,800
output/call = 1,000

input_total  = 5 × 12,800 = 64,000
output_total = 5 × 1,000 = 5,000
USD ≒ 64 × 0.003 + 5 × 0.015 = $0.192 + $0.075 = $0.267
```

`planner=prune` を使わない場合は 12 / 5 = 2.4 倍、約 **$0.64** に増えます。大規模 PR では `planner=prune` の効果が大きいとわかります。

## 3. コスト最適化の打ち手

### 3-1. プロンプトキャッシュを切らない（デフォルト推奨）

PR #811 で導入された Anthropic ephemeral prompt caching は **5 分 TTL** で systemPrompt の再送料金を ~90% カットします。グローバル無効化は `RIVER_ANTHROPIC_PROMPT_CACHE=0`、skill 単位は `skill.disableCache: true` ですが、特殊な要件がなければ ON のままにしてください。

### 3-2. planner=prune で対象スキルを絞る

`config.skills[].applyTo` を厳密化し、`planner: prune` を使うことで関連性の低い skill を実行前に除外できます。大規模 PR で **2-3 倍のコスト削減** が見込めます。

### 3-3. モデルの段階使い分け

| 用途                      | 推奨モデル                        | input 単価比 |
| ------------------------- | --------------------------------- | ------------ |
| 軽量 lint / pattern match | `claude-haiku-4-5`, `gpt-4o-mini` | 1x (基準)    |
| バランス                  | `claude-sonnet-4-6`, `gpt-4o`     | 3-25x        |
| 重要レビュー              | `claude-opus-4-7`, `o1`           | 15-100x      |

`SkillSchema.modelHint` で `cheap` を指定するか、skill 個別に `model` を切り替えると `mini` 系へ自動振り分けされます。

### 3-4. `--estimate` と `--max-cost` の併用

実行前にコスト見積もりだけを出力できます。

```bash
node src/cli.mjs run --estimate --max-cost 1.50
```

`--max-cost` を超える試算が出た場合は実行を中断します。CI のコスト暴走防止に有効です。

## 4. 実測値の収集

PR #813 / #814 で usage telemetry パイプラインが整備されました。**自分のリポジトリ・自分の skill 構成での実コスト** を測定する手順:

### Step 1. オプトイン

```bash
export RIVER_USAGE_TELEMETRY=1   # disk 永続化を有効化
export RIVER_AI_RETRY_DEBUG=1    # call ごとに stdout にも usage 出力（任意）
```

### Step 2. レビュー実行

通常通り `npm run river -- review` 等を実行します。完了時に `artifacts/usage/<YYYY-MM-DD>-<runId>.jsonl` へ 1 (file, skill) ペア = 1 行 で書き込まれます。

JSONL のスキーマ:

```json
{
  "timestamp": "2026-05-14T05:55:00.000Z",
  "runId": "abcd1234",
  "commit": "deadbeef",
  "file": "src/auth.mjs",
  "skill": "security",
  "provider": "anthropic",
  "model": "claude-sonnet-4-6",
  "inputTokens": 1234,
  "outputTokens": 567,
  "cacheCreationInputTokens": 100,
  "cacheReadInputTokens": 50
}
```

### Step 3. 集計

```bash
npm run usage:summary                  # モデル別の集計（人間向け）
npm run usage:summary -- --group skill # skill 別
npm run usage:summary -- --group run   # 実行単位
npm run usage:summary -- --group day   # 日別
npm run usage:summary -- --json        # JSON 出力（外部ツール連携用）
```

出力例:

```text
Group: model
  claude-sonnet-4-6            calls=  24 in=  105600 out=  14400 cacheRead=  84800 hit= 80.3% usd=$0.3210
  gpt-4o-mini                  calls=   8 in=    8000 out=    400 cacheRead=    3500 hit= 43.8% usd=$0.0014

  TOTAL                        calls=  32 in=  113600 out=  14800 cacheRead=  88300              usd=$0.3224
```

### Step 4. 月額試算

1 週間〜1 ヶ月分の `artifacts/usage/` を蓄積し、`usd` の合計を回数で除して **PR 1 件あたりの平均コスト** を算出。そこに月の PR 数を掛けて月額試算が出ます。

## 5. プロバイダー別 pricing 一覧

`PRICING_LAST_UPDATED = 2026-05-14` 時点の単価（USD / 1M tokens）。最新値は [Anthropic 公式](https://www.anthropic.com/pricing) / [OpenAI 公式](https://openai.com/pricing) で確認してください。

| Model               | Input  | Output | Cache Read |
| ------------------- | ------ | ------ | ---------- |
| `claude-opus-4-7`   | $15.00 | $75.00 | $1.50      |
| `claude-sonnet-4-6` | $3.00  | $15.00 | $0.30      |
| `claude-haiku-4-5`  | $1.00  | $5.00  | $0.10      |
| `gpt-4o`            | $2.50  | $10.00 | $1.25      |
| `gpt-4o-mini`       | $0.15  | $0.60  | $0.075     |
| `o1`                | $15.00 | $60.00 | —          |
| `o1-mini`           | $3.00  | $12.00 | —          |
| `gpt-4-turbo`       | $10.00 | $30.00 | —          |
| `gpt-3.5-turbo`     | $0.50  | $1.50  | —          |

Anthropic の cache write は `inputPer1k` の **+25% 課金**、cache read は **10%** です。OpenAI の cache read は **50%** です。

## 6. 関連リンク

- 実装: `src/core/cost-estimator.mjs` / `src/lib/usage-persistence.mjs`
- スクリプト: `scripts/usage-summary.mjs`
- 関連 PR: [#811 (prompt caching)](https://github.com/s977043/river-review/pull/811) / [#813 (Phase 1 telemetry)](https://github.com/s977043/river-review/pull/813) / [#814 (Phase 2 telemetry)](https://github.com/s977043/river-review/pull/814)
- 関連 Issue: [#803](https://github.com/s977043/river-review/issues/803)
