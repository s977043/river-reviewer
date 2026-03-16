---
id: adversarial-review
name: adversarial-review
description: |
  認知バイアスを排除するための3つの敵対的分析手法を統合したレビュースキル。
  Pre-mortem（失敗シナリオ分析）、War Game（攻撃者シミュレーション）、
  Logic Torturing（論理検証）を組み合わせ、通常のレビューでは見えない
  設計の盲点・防御の穴・論理の弱点を可視化する。
category: upstream
phase: [upstream, midstream]
severity: major
applyTo:
  - 'src/**/*.{ts,tsx,js,jsx,mjs}'
  - 'docs/**/*design*.md'
  - 'docs/adr/**/*'
  - 'pages/**/*design*.md'
inputContext: [diff, fullFile]
outputKind: [findings, questions, actions]
tags: [adversarial, pre-mortem, war-game, logic-torturing, cognitive-bias, entry, routing]
---

# Adversarial Review（敵対的レビュー）

通常のコードレビューは「正しさの確認」に集中する。
敵対的レビューは **「どう壊れるか」「どう攻撃されるか」「どこが論理的に弱いか」** に集中する。

## 背景 / Background

AIをレビューに使う最大の価値は、情報の整理ではなく **思考の死角を映す鏡** としての活用にある。
このスキルは、3つの認知バイアス対策手法を体系化し、レビューの質を根本的に引き上げる。

| 手法            | 対策するバイアス           | 核心の問い                           |
| --------------- | -------------------------- | ------------------------------------ |
| Pre-mortem      | 生存バイアス・楽観バイアス | 「失敗した**として**、なぜ？」       |
| War Game        | 自己中心バイアス           | 「敵の立場**から**、どう攻撃する？」 |
| Logic Torturing | 確証バイアス               | 「この論理の穴を**潰して**」         |

## When to Use / いつ使うか

- 設計判断やアーキテクチャ変更を含むPRのレビュー時
- セキュリティに影響する変更のレビュー時
- 重要な技術選択の妥当性を検証したいとき
- 「本当にこれで大丈夫か？」という不安があるとき

## Routing / ルーティング

入力に応じて、適切な手法へルーティングする。複数手法の併用も可能。

| キーワード                                   | 手法            | スキルID                           |
| -------------------------------------------- | --------------- | ---------------------------------- |
| 失敗, リスク, 負債, インシデント, pre-mortem | Pre-mortem      | `rr-upstream-pre-mortem-001`       |
| 攻撃, セキュリティ, 悪用, 脆弱性, war-game   | War Game        | `rr-midstream-war-game-001`        |
| 論理, 判断, 根拠, なぜ, 代替案, logic        | Logic Torturing | `rr-midstream-logic-torturing-001` |
| 敵対的, adversarial, 全部, フル              | **全手法実行**  | 上記3つすべて                      |

### デフォルト動作

- キーワード指定なし → 変更内容から自動判定:
  - 設計ドキュメント/ADR → Pre-mortem + Logic Torturing
  - セキュリティ関連コード → War Game + Logic Torturing
  - 一般的なコード変更 → Logic Torturing
  - 大規模変更（ファイル数10以上or差分500行以上）→ 全手法実行

## Execution Flow / 実行フロー

```text
1. 変更内容の分類
   ├─ 設計/ADR → Pre-mortem を優先実行
   ├─ セキュリティ関連 → War Game を優先実行
   └─ 判断を含む変更 → Logic Torturing を実行

2. 各手法の実行（並列可能）
   ├─ Pre-mortem: 失敗シナリオ × 最大5件
   ├─ War Game: 攻撃シナリオ × 最大5件
   └─ Logic Torturing: 論理検証 × 最大5件

3. 統合サマリの生成
   ├─ 重複する指摘の統合
   ├─ 重大度による優先順位付け
   └─ Human Handoff 条件の判定
```

## Output Format / 出力形式

```markdown
## 🔍 Adversarial Review Summary

### 検出された盲点: N件

- Pre-mortem: X件 (失敗シナリオ)
- War Game: Y件 (攻撃シナリオ)
- Logic Torturing: Z件 (論理的な穴)

### 最も重大な発見

<最も致命的な1件の要約>

### 詳細

(各手法の出力を統合)
```

## 他スキルとの関係

| 既存スキル                                   | 関係 | 棲み分け                                                                                                          |
| -------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------- |
| `rr-upstream-architecture-risk-register-001` | 補完 | risk-register は「リスクが文書化されているか」を確認。Pre-mortem は「文書化されていないリスクを発見」する         |
| `rr-midstream-security-basic-001`            | 補完 | security-basic は既知パターン（SQLi, XSS等）を検出。War Game は「既知パターンに当てはまらない攻撃経路」を発見する |
| `rr-upstream-adr-decision-quality-001`       | 補完 | adr-decision は ADR の形式品質を確認。Logic Torturing は「記述された判断の論理的強度」を検証する                  |

## References

- [TECHNIQUES.md](./references/TECHNIQUES.md): 3手法の理論的背景と実践ガイド
