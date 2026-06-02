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

### アクセシビリティ（アクセシブルネーム）

- 日本語: alt属性, aria-label, アクセシブルネーム, ボタンラベル, フォームラベル
- 英語: alt text, aria-label, accessible name, button label, form label
- → `rr-midstream-a11y-accessible-name-001`

### デザインシステム コンポーネント再利用

- 日本語: デザインシステム, コンポーネント再利用, Button, Input, Modal, Card
- 英語: design system, component reuse, Button, Input, Modal, Card
- → `rr-midstream-design-system-component-reuse-001`

### デザイントークン

- 日本語: デザイントークン, 色の直書き, 余白, フォントサイズ, 角丸
- 英語: design token, hardcoded color, spacing, font size, border radius
- → `rr-midstream-design-token-enforcement-001`

### レビュー統合（マルチエージェント）

- 日本語: レビュー統合, 複数レビュー, マージ推奨, ハルシネーション検証
- 英語: review synthesis, multi-agent, merge recommendation, hallucination guard
- → `rr-midstream-independent-review-synthesis-001`

### インタラクティブ UI アクセシビリティ

- 日本語: キーボード操作, フォーカス管理, ARIA role, ライブリージョン
- 英語: keyboard navigation, focus management, ARIA role, live region, interactive UI
- → `rr-midstream-modern-web-a11y-interactive-001`

### ブラウザ互換性・Baseline

- 日本語: ブラウザ互換, Baseline, プログレッシブエンハンスメント, feature detection
- 英語: browser compatibility, Baseline, progressive enhancement, feature detection, @supports
- → `rr-midstream-modern-web-browser-compat-001`

### セマンティック HTML・プラットフォームネイティブ

- 日本語: セマンティック, div クリック, ネイティブ要素, Web Platform
- 英語: semantic HTML, div onclick, platform-native, Web Platform, native API
- → `rr-midstream-modern-web-semantic-001`

### Next.js App Router 境界

- 日本語: Next.js, App Router, サーバーコンポーネント, クライアントコンポーネント, use client
- 英語: Next.js, App Router, server component, client component, use client directive
- → `rr-midstream-nextjs-app-router-boundary-001`

## 自動判定ルール

1. `.ts`/`.tsx` ファイル → `rr-midstream-typescript-strict-001` + `rr-midstream-typescript-nullcheck-001`
2. React コンポーネント → `rr-midstream-a11y-accessible-name-001` を追加
3. `app/` ディレクトリ（Next.js）→ `rr-midstream-nextjs-app-router-boundary-001` を追加
4. 設定・型定義ファイル → `rr-midstream-type-driven-design-001`

## フォールバックルール

1. キーワード指定なし → 変更ファイルの拡張子とパスで自動判定
2. 複数該当 → 関連する全スキル実行
3. 判定不能 → 一般的なコード品質チェックリスト（SKILL.md のチェックリスト）を適用
