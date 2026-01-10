# ルーティングルール

River Reviewer のルーティングロジックの詳細です。

## キーワードマッチング

以下のキーワードに基づいて専門スキルを選択します：

### 設計・アーキテクチャ (river-reviewer-architecture)

- 日本語: 設計, アーキテクチャ, ADR, 構成, モジュール, 依存関係
- 英語: design, architecture, ADR, structure, module, dependency

### セキュリティ (river-reviewer-security)

- 日本語: セキュリティ, 脆弱性, 認証, 認可, 暗号化
- 英語: security, vulnerability, auth, authorization, encryption

### パフォーマンス (river-reviewer-performance)

- 日本語: パフォーマンス, 最適化, 高速化, メモリ, キャッシュ
- 英語: performance, optimization, speed, memory, cache

### テスト (river-reviewer-testing)

- 日本語: テスト, カバレッジ, 単体テスト, 結合テスト
- 英語: test, coverage, unit test, integration test

### 一般コード (river-reviewer-code) - デフォルト

上記のいずれにも該当しない場合、一般コードレビューを実行します。

## フォールバックルール

1. 複数のカテゴリに該当する場合は、最初にマッチしたものを優先
2. 明示的な指定がある場合はそれを優先（例: 「セキュリティ観点でレビューして」）
3. 不明な場合は一般コードレビューにフォールバック
