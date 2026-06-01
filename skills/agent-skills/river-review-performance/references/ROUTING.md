# ルーティングルール — Performance Review

## キーワードマッチング

### キャッシュ戦略

- 日本語: キャッシュ, TTL, 無効化, Redis
- 英語: cache, TTL, invalidation, Redis
- → `rr-upstream-cache-strategy-consistency-001`

### 障害モード・可観測性

- 日本語: 障害, 監視, メトリクス, アラート, ダッシュボード
- 英語: failure, monitoring, metrics, alert, dashboard
- → `rr-upstream-failure-modes-observability-001`

### ロギング・可観測性

- 日本語: ログ, トレース, 構造化ログ
- 英語: log, trace, structured logging
- → `rr-midstream-logging-observability-001`

### 運用性・SLO

- 日本語: SLO, レイテンシ, スループット, 運用
- 英語: SLO, latency, throughput, operability
- → `rr-upstream-operability-slo-001`

## ヒューリスティクス（キーワードなしの場合）

1. ループ内の I/O パターン → N+1 クエリ検出を重点チェック
2. 大量データ処理 → メモリ効率とストリーム処理を確認
3. 外部 API 呼び出し → タイムアウト・リトライ・サーキットブレーカーを検証
4. DB クエリ変更 → インデックス利用と実行計画を確認

## フォールバックルール

1. キーワード指定なし → 変更内容からヒューリスティクスで判定
2. 複数該当 → 全スキル実行
3. 判定不能 → 一般的なパフォーマンスチェックリスト（SKILL.md のチェックリスト）を適用
