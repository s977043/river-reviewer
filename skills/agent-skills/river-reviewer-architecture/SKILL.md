---
id: river-reviewer-architecture
name: river-reviewer-architecture
description: |
  設計・アーキテクチャ観点のレビューエージェント。
  依存関係、境界設計、データモデル、API設計等の個別スキルへルーティングする。
category: upstream
phase: [upstream]
severity: major
applyTo:
  - 'src/**/*.{ts,tsx,js,jsx,mjs}'
  - 'docs/**/*design*.md'
  - 'docs/adr/**/*'
  - 'pages/**/*design*.md'
inputContext: [diff, fullFile, adr]
outputKind: [findings, questions, actions]
tags: [architecture, design, entry, routing]
version: 0.1.0
---

# Architecture Review（設計・アーキテクチャレビュー）

設計判断の妥当性、アーキテクチャ境界の整合性、データモデルの一貫性を検証する。

## When to Use / いつ使うか

- アーキテクチャに影響する変更を含むPRのレビュー時
- ADR（Architecture Decision Record）のレビュー時
- モジュール構成や依存関係の変更時
- API設計の新規作成・変更時

## Routing / ルーティング

入力に応じて、適切な個別スキルへルーティングする。

| キーワード              | スキルID                                       | 説明                       |
| ----------------------- | ---------------------------------------------- | -------------------------- |
| ADR, 意思決定           | `rr-upstream-adr-decision-quality-001`         | ADR の品質検証             |
| API, エンドポイント     | `rr-upstream-api-design-001`                   | API 設計レビュー           |
| API互換, バージョニング | `rr-upstream-api-versioning-compat-001`        | API バージョン互換性       |
| 境界, モジュール        | `rr-upstream-architecture-boundaries-001`      | アーキテクチャ境界         |
| 図, ダイアグラム        | `rr-upstream-architecture-diagrams-001`        | 設計図の整合性             |
| リスク                  | `rr-upstream-architecture-risk-register-001`   | リスク登録の検証           |
| トレーサビリティ        | `rr-upstream-architecture-traceability-001`    | 要件追跡性                 |
| 検証計画                | `rr-upstream-architecture-validation-plan-001` | 検証計画レビュー           |
| 可用性, 冗長            | `rr-upstream-availability-architecture-001`    | 可用性設計                 |
| ドメイン, コンテキスト  | `rr-upstream-bounded-context-language-001`     | 境界づけられたコンテキスト |
| キャッシュ              | `rr-upstream-cache-strategy-consistency-001`   | キャッシュ戦略             |
| コスト, キャパシティ    | `rr-upstream-capacity-cost-design-001`         | キャパシティ設計           |
| データフロー, 状態      | `rr-upstream-data-flow-state-ownership-001`    | データフロー設計           |
| データモデル, DB        | `rr-upstream-data-model-db-design-001`         | データモデル設計           |
| DR, マルチリージョン    | `rr-upstream-dr-multiregion-001`               | 災害復旧設計               |
| イベント駆動            | `rr-upstream-event-driven-semantics-001`       | イベント駆動設計           |
| 外部依存                | `rr-upstream-external-dependencies-001`        | 外部依存関係               |
| 障害, 可観測性          | `rr-upstream-failure-modes-observability-001`  | 障害モード分析             |
| 結合, コントラクト      | `rr-upstream-integration-contracts-001`        | 結合コントラクト           |
| マイグレーション        | `rr-upstream-migration-rollout-rollback-001`   | マイグレーション計画       |
| マルチテナント          | `rr-upstream-multitenancy-isolation-001`       | テナント分離               |
| OpenAPI                 | `rr-upstream-openapi-contract-001`             | OpenAPI 仕様検証           |
| SLO, 運用性             | `rr-upstream-operability-slo-001`              | 運用性・SLO                |
| 要件, 受入              | `rr-upstream-requirements-acceptance-001`      | 要件・受入条件             |

### デフォルト動作

- キーワード指定なし → 変更内容から自動判定
- 複数カテゴリに該当 → もっとも関連性の高いスキルを優先

## Execution Flow / 実行フロー

```text
1. 変更種別の判定
   ├─ ADR/設計ドキュメント → adr-decision-quality を優先
   ├─ API定義/エンドポイント → api-design, api-versioning-compat を優先
   ├─ モジュール構成変更 → architecture-boundaries を優先
   ├─ データモデル変更 → data-model-db-design を優先
   └─ キーワード指定あり → 該当スキルを直接選択

2. スキルの実行（該当する専門スキルを並列実行可能）
   ├─ 設計品質系: adr-decision-quality, architecture-diagrams, architecture-traceability
   ├─ 構造系: architecture-boundaries, bounded-context-language, data-flow-state-ownership
   ├─ API系: api-design, api-versioning-compat, openapi-contract, integration-contracts
   ├─ 運用系: availability-architecture, capacity-cost-design, dr-multiregion, operability-slo
   └─ リスク系: architecture-risk-register, failure-modes-observability, external-dependencies

3. 統合
   ├─ 重複する指摘の除去
   └─ 複数カテゴリ該当時は関連性の高いスキルを優先
```

## Output Format / 出力形式

```text
<file>:<line>: <message>
```

- **Finding**: 何が問題か（1文）
- **Impact**: 何が困るか（短く）
- **Fix**: 次の一手（最小の修正案）

## 他スキルとの関係

| スキル                    | 関係 | 棲み分け                                                      |
| ------------------------- | ---- | ------------------------------------------------------------- |
| `adversarial-review`      | 補完 | architecture は「設計の正しさ」、adversarial は「設計の盲点」 |
| `river-reviewer-security` | 補完 | architecture は「構造」、security は「脆弱性」                |
| `river-reviewer-code`     | 補完 | architecture は「マクロ設計」、code は「ミクロ品質」          |

## References

- [ROUTING.md](./references/ROUTING.md): 詳細なルーティングルール
