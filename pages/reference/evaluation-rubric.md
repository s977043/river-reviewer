# 評価ルーブリック・リファレンス

## 概要

River Reviewer の評価システムは、従来の inclusion ベースのチェック（must_include トークンマッチング）に加え、多次元ルーブリックによるレビュー品質の評価をサポートします。

## ルーブリック次元

| ID | 名前 | 方式 | 自動化 | Weight | 既存メトリクス対応 |
|----|------|------|--------|--------|-------------------|
| `detection_accuracy` | 検出精度 | ratio | ✅ | 0.25 | passRate |
| `false_positive_rate` | 偽陽性率 | ratio | ✅ | 0.20 | falsePositiveRate |
| `evidence_quality` | エビデンス品質 | ratio | ✅ | 0.15 | evidenceRate |
| `severity_alignment` | 重要度適切性 | ratio | ✅ | 0.15 | （新規） |
| `phase_consistency` | フェーズ一貫性 | binary | ✅ | 0.10 | （新規） |
| `actionability` | アクショナビリティ | manual | ❌ | 0.10 | （新規） |
| `token_efficiency` | トークン効率 | ratio | ✅ | 0.05 | （新規） |

## スコアリング方式

| 方式 | 説明 | 値の範囲 |
|------|------|----------|
| `binary` | 合格/不合格の二値判定 | 0 or 1 |
| `ratio` | 成功数 / 全体数の比率 | 0.0 – 1.0 |
| `manual` | 人間による主観評価 | null（未評価）または 0.0 – 1.0 |

## Weight（重み）

各次元の weight は合計 1.0 になるよう設計されています。weight は加重平均スコアの算出に使用されます。

ユーザーは `eval/rubric.yaml` を編集して weight を調整できます。

## 既存 fixture との関係

現在の fixture ベース評価（`must_include` トークンマッチング）は以下の次元に対応します:

- `detection_accuracy` ← passRate（期待された指摘の検出率）
- `false_positive_rate` ← falsePositiveRate（guard case での偽陽性率）
- `evidence_quality` ← evidenceRate（Evidence トークンの出現率）

新しい次元（`severity_alignment`, `phase_consistency`, `actionability`, `token_efficiency`）は、fixture に追加のメタデータを持たせることで段階的に自動化できます。

## dimensionScores（eval-ledger-entry）

評価結果は `eval-ledger-entry.schema.json` の `dimensionScores` フィールドに記録されます:

```json
{
  "dimensionScores": [
    { "dimensionId": "detection_accuracy", "score": 0.85, "method": "ratio" },
    { "dimensionId": "actionability", "score": null, "method": "manual", "details": "未評価" }
  ]
}
```

`manual` 次元は `score: null` で記録され、人間によるレビューを待ちます。

## トレードオフと制限事項

- **自動化の限界**: `actionability` は自然言語の意味解析が必要であり、完全自動化は困難
- **phase_consistency**: River Reviewer 固有の差別化要因として重要だが、フェーズの正解ラベルをどう定義するかは設計判断が必要
- **token_efficiency**: Context Budget の定義が確定するまで、暫定的な指標にとどまる

## 関連

- [スキーマ: eval-rubric.schema.json](/schemas/eval-rubric.schema.json)
- [スキーマ: eval-ledger-entry.schema.json](/schemas/eval-ledger-entry.schema.json)
- [fixture 形式リファレンス](./evaluation-fixture-format.md)
- [用語集](./glossary.md)
