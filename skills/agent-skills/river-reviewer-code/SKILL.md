---
id: river-reviewer-code
name: river-reviewer-code
description: |
  一般コード品質のレビューエージェント。デフォルトのフォールバック先。
  可読性、保守性、型安全性、ロギング等の個別スキルへルーティングする。
category: midstream
phase: [midstream]
severity: minor
applyTo:
  - 'src/**/*.{ts,tsx,js,jsx,mjs}'
inputContext: [diff, fullFile]
outputKind: [findings, actions]
tags: [code-quality, default, entry, routing]
version: 0.1.0
---

# Code Quality Review（一般コード品質レビュー）

コードの可読性、保守性、型安全性を検証する。他の専門エージェントに該当しない場合のデフォルトフォールバック先。

## When to Use / いつ使うか

- 一般的なコード変更のレビュー時
- 他の専門エージェント（architecture, security, performance, testing）に該当しない場合
- コード品質の総合的なチェックが必要な場合

## Routing / ルーティング

| キーワード                | スキルID                                      | 説明                         |
| ------------------------- | --------------------------------------------- | ---------------------------- |
| 型, TypeScript, strict    | `rr-midstream-typescript-strict-001`          | TypeScript strict モード準拠 |
| null, undefined, optional | `rr-midstream-typescript-nullcheck-001`       | null 安全性チェック          |
| 型駆動, 設計              | `rr-midstream-type-driven-design-001`         | 型駆動設計                   |
| ログ, 監視                | `rr-midstream-logging-observability-001`      | ロギング・可観測性           |
| 自動化, 境界              | `rr-midstream-review-automation-boundary-001` | レビュー自動化の境界         |
| コメント, トリアージ      | `rr-midstream-review-comment-triage-001`      | レビューコメント分類         |
| a11y, アクセシビリティ    | `rr-midstream-a11y-accessible-name-001`       | アクセシビリティ基本         |
| Next.js, App Router       | `rr-midstream-nextjs-app-router-boundary-001` | Next.js 境界チェック         |

### デフォルト動作

- キーワード指定なし → 以下のヒューリスティクスで判定:
  - `.ts`/`.tsx`ファイル → TypeScript strict + nullチェック
  - コンポーネントファイル → a11yチェック追加
  - 設定ファイル → 型駆動設計チェック

## Checklist / チェックリスト

一般コードレビューでは以下を確認する:

### 可読性

- 関数・変数の命名が意図を表現しているか
- 関数の責務が単一か
- ネストが深すぎないか（3段以内）
- マジックナンバー・マジックストリングがないか

### 保守性

- DRY原則にしたがっているか（ただし過度な抽象化を避ける）
- 変更の影響範囲が限定的か
- 依存方向が正しいか

### 型安全性

- `any`の使用が最小限か
- 型ガードが適切か
- null/undefinedの扱いが安全か

### エラーハンドリング

- エラーを握り潰していないか
- エラーメッセージが十分な情報を含むか
- リカバリー可能なエラーと不可能なエラーの区別

## Execution Flow / 実行フロー

```text
1. ファイル種別の判定
   ├─ .ts/.tsxファイル → TypeScript strict + nullチェックを選択
   ├─ コンポーネントファイル → a11yチェックを追加
   ├─ 設定ファイル → 型駆動設計チェックを選択
   └─ キーワード指定あり → 該当スキルを直接選択

2. スキルの実行
   ├─ typescript-strict: strictモード準拠
   ├─ typescript-nullcheck: null安全性
   ├─ type-driven-design: 型駆動設計
   ├─ logging-observability: ロギング・可観測性
   ├─ review-automation-boundary: レビュー自動化の境界
   ├─ a11y-accessible-name: アクセシビリティ
   └─ nextjs-app-router-boundary: Next.js境界

3. 統合
   ├─ 重複する指摘の除去
   └─ Checklistに基づく一般品質チェックの補完
```

## Output Format / 出力形式

```text
<file>:<line>: <message>
```

- **Finding**: 何が問題か（1文）
- **Impact**: 何が困るか（短く）
- **Fix**: 次の一手（最小の修正案）

## 他スキルとの関係

| スキル                        | 関係 | 棲み分け                                                    |
| ----------------------------- | ---- | ----------------------------------------------------------- |
| `river-reviewer-architecture` | 補完 | code は「ミクロ品質」、architecture は「マクロ設計」        |
| `river-reviewer-testing`      | 補完 | code は「プロダクションコード」、testing は「テストコード」 |
| `river-reviewer-performance`  | 補完 | code は「可読性」、performance は「実行効率」               |

## References

- [ROUTING.md](./references/ROUTING.md): 詳細なルーティングルール
