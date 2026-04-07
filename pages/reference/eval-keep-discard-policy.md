---
sidebar_label: 評価ベースの採否基準
---

# 評価ベースの採否基準（Keep/Discard Policy）

## 概要

River Reviewer の skill / planner / routing / output policy の変更は、必ず評価結果に基づいて採否を判断する。「改善したつもり」を排除し、ledger に記録された baseline と candidate の比較で意思決定する。

## 評価指標

| 指標 | 説明 | 計測元 |
|---|---|---|
| planner coverage | 期待スキルが選択される割合 | `npm run planner:eval` |
| planner top1Match | 最優先スキルの一致率 | `npm run planner:eval` |
| must_include recall | fixture で期待トークンが出力に含まれる割合 | `npm run eval:fixtures` |
| false positive rate | guard case (expectNoFindings) で誤検出した割合 | `npm run eval:fixtures` |
| evidence attachment rate | findings に `Evidence:` が含まれる割合 | `npm run eval:fixtures` |
| severity consistency | severity が rubric と整合する割合 | 将来追加 |
| meta consistency | version/tag の整合性 | `npm run meta:validate` |

## 採否ルール

### Keep（採用）する条件

以下のいずれかを満たす場合、変更を keep とする:

1. **must_include recall が改善**し、他の指標が悪化していない
2. **recall が同等**で、false positive rate が減少
3. **recall が同等**で、実装が単純化されている（行数削減、依存削減）
4. **planner coverage が改善**し、他の指標が悪化していない

### Discard（棄却）する条件

以下のいずれかに該当する場合、変更を discard とする:

1. **evidence_rate が悪化**（根拠なき指摘の増加）
2. **planner coverage が 5% を超えて低下**
3. **must_include recall が低下**
4. **npm test または npm run lint が失敗**
5. **crash（実行時エラー）が発生**

### 判断が分かれる場合

- 複数の指標が相反する場合は、**evidence_rate > recall > false_positive_rate** の優先順で判断する
- 小規模な変動（±2% 以内）は統計的に有意でない可能性があるため、2 回以上の実行で確認する

## 運用手順

1. 変更前に `npm run eval:all -- --append-ledger --description "baseline"` を実行
2. 変更を実施
3. 変更後に `npm run eval:all -- --append-ledger --description "candidate: <変更内容>"` を実行
4. `artifacts/evals/results.jsonl` の直近 2 エントリを比較
5. 上記ルールに基づいて keep/discard を判断
6. PR に判断根拠を記載

## 参考

- [autoagent](https://github.com/kevinrgu/autoagent) の keep/discard ルールを River Reviewer 向けに翻訳
- 単一指標（passed count）の最適化ではなく、多軸評価を採用
