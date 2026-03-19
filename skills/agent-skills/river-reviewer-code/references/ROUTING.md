# ルーティングルール — Code Quality Review

## キーワードマッチング

### TypeScript strict

- 日本語: 型, TypeScript, strict, 型安全
- 英語: type, TypeScript, strict, type safety
- → `rr-midstream-typescript-strict-001`

### null チェック

- 日本語: null, undefined, optional, 未定義
- 英語: null, undefined, optional, nullable
- → `rr-midstream-typescript-nullcheck-001`

### 型駆動設計

- 日本語: 型駆動, 設計, 型で表現
- 英語: type-driven, design, express with types
- → `rr-midstream-type-driven-design-001`

### ロギング

- 日本語: ログ, 監視, トレース
- 英語: log, monitoring, trace
- → `rr-midstream-logging-observability-001`

### レビュー自動化

- 日本語: 自動化, 境界, 人間判断
- 英語: automation, boundary, human judgment
- → `rr-midstream-review-automation-boundary-001`

### コメントトリアージ

- 日本語: コメント, トリアージ, 優先度
- 英語: comment, triage, priority
- → `rr-midstream-review-comment-triage-001`

### アクセシビリティ

- 日本語: a11y, アクセシビリティ, スクリーンリーダー
- 英語: a11y, accessibility, screen reader, aria
- → `rr-midstream-a11y-accessible-name-001`

### Next.js App Router

- 日本語: Next.js, App Router, サーバーコンポーネント
- 英語: Next.js, App Router, Server Component, use client
- → `rr-midstream-nextjs-app-router-boundary-001`

## 自動判定ルール

1. `.ts`/`.tsx` ファイル → `typescript-strict-001` + `typescript-nullcheck-001`
2. React コンポーネント → `a11y-accessible-name-001` を追加
3. `app/` ディレクトリ（Next.js）→ `nextjs-app-router-boundary-001` を追加
4. 設定・型定義ファイル → `type-driven-design-001`

## フォールバックルール

1. キーワード指定なし → 変更ファイルの拡張子とパスで自動判定
2. 複数該当 → 関連する全スキル実行
3. 判定不能 → 一般的なコード品質チェックリスト（SKILL.md のチェックリスト）を適用
