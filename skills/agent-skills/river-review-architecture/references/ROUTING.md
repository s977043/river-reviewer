# ルーティングルール — Architecture Review

## キーワードマッチング

### ADR・意思決定

- 日本語: ADR, 意思決定, 判断, 記録
- 英語: ADR, decision, record
- → `rr-upstream-adr-decision-quality-001`

### API 設計

- 日本語: API, エンドポイント, REST, GraphQL
- 英語: API, endpoint, REST, GraphQL
- → `rr-upstream-api-design-001`

### API バージョニング

- 日本語: API互換, バージョニング, 後方互換
- 英語: versioning, compatibility, breaking change
- → `rr-upstream-api-versioning-compat-001`

### アーキテクチャ境界

- 日本語: 境界, モジュール, レイヤー, 依存方向
- 英語: boundary, module, layer, dependency direction
- → `rr-upstream-architecture-boundaries-001`

### 設計図

- 日本語: 図, ダイアグラム, 構成図
- 英語: diagram, architecture diagram
- → `rr-upstream-architecture-diagrams-001`

### リスク登録

- 日本語: リスク, リスク登録
- 英語: risk, risk register
- → `rr-upstream-architecture-risk-register-001`

### トレーサビリティ

- 日本語: トレーサビリティ, 追跡, 要件紐付け
- 英語: traceability, trace, requirement link
- → `rr-upstream-architecture-traceability-001`

### 検証計画

- 日本語: 検証計画, バリデーション
- 英語: validation plan
- → `rr-upstream-architecture-validation-plan-001`

### 可用性

- 日本語: 可用性, 冗長, HA
- 英語: availability, redundancy, HA
- → `rr-upstream-availability-architecture-001`

### ドメインモデリング

- 日本語: ドメイン, コンテキスト, ユビキタス言語
- 英語: domain, bounded context, ubiquitous language
- → `rr-upstream-bounded-context-language-001`

### キャッシュ

- 日本語: キャッシュ, TTL, 無効化
- 英語: cache, TTL, invalidation
- → `rr-upstream-cache-strategy-consistency-001`

### キャパシティ・コスト

- 日本語: コスト, キャパシティ, スケーリング
- 英語: cost, capacity, scaling
- → `rr-upstream-capacity-cost-design-001`

### データフロー

- 日本語: データフロー, 状態管理, オーナーシップ
- 英語: data flow, state, ownership
- → `rr-upstream-data-flow-state-ownership-001`

### データモデル

- 日本語: データモデル, DB, テーブル, スキーマ
- 英語: data model, database, table, schema
- → `rr-upstream-data-model-db-design-001`

### DR・マルチリージョン

- 日本語: DR, 災害復旧, マルチリージョン
- 英語: DR, disaster recovery, multi-region
- → `rr-upstream-dr-multiregion-001`

### イベント駆動

- 日本語: イベント駆動, メッセージ, Pub/Sub
- 英語: event-driven, message, pub/sub
- → `rr-upstream-event-driven-semantics-001`

### 外部依存

- 日本語: 外部依存, サードパーティ, ライブラリ
- 英語: external dependency, third-party, library
- → `rr-upstream-external-dependencies-001`

### 障害モード

- 日本語: 障害, 可観測性, アラート
- 英語: failure mode, observability, alert
- → `rr-upstream-failure-modes-observability-001`

### 結合コントラクト

- 日本語: 結合, コントラクト, インターフェース
- 英語: integration, contract, interface
- → `rr-upstream-integration-contracts-001`

### マイグレーション

- 日本語: マイグレーション, ロールアウト, ロールバック
- 英語: migration, rollout, rollback
- → `rr-upstream-migration-rollout-rollback-001`

### マルチテナント

- 日本語: マルチテナント, テナント分離
- 英語: multi-tenant, tenant isolation
- → `rr-upstream-multitenancy-isolation-001`

### OpenAPI

- 日本語: OpenAPI, Swagger, API仕様
- 英語: OpenAPI, Swagger, API spec
- → `rr-upstream-openapi-contract-001`

### SLO・運用性

- 日本語: SLO, 運用性, オンコール
- 英語: SLO, operability, on-call
- → `rr-upstream-operability-slo-001`

### 要件・受入

- 日本語: 要件, 受入条件, ストーリー
- 英語: requirement, acceptance criteria, story
- → `rr-upstream-requirements-acceptance-001`

## フォールバックルール

1. 複数カテゴリに該当 → 最も変更量が多い領域を優先
2. 明示的指定あり → そのスキルを優先
3. 不明な場合 → `rr-upstream-architecture-boundaries-001`（最も汎用的）
