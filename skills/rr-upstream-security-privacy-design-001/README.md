# Security & Privacy Design Review

設計ドキュメントにおけるセキュリティ・プライバシー設計のレビューを行うスキルです。

## 概要

このスキルは、設計ドキュメントを分析し、データライフサイクル管理とプライバシーに関する設計上のギャップを検出します：

- **データ保持ポリシー**: PII/個人情報の保持期間が明確か
- **データ削除**: ユーザー削除リクエストへの対応方法が記載されているか
- **バックアップ残存**: バックアップやログにおける PII の残存期間と削除方法
- **データレジデンシ**: データが保存・処理されるリージョン/国が明示されているか
- **監査ログ**: 個人情報アクセスの監査証跡が設計されているか

## 対象ファイル

```text
**/*.md
**/*.adoc
**/design/**/*
**/rfc/**/*
**/spec/**/*
**/docs/architecture/**/*
```

## 出力例

```text
**Finding:** Data retention period undefined for user profiles
**Evidence:** Section "Data Model" defines PII fields but no retention period
**Impact:** Without defined retention, PII may be kept indefinitely
**Fix:** Add retention policy: "User profiles are retained for 2 years after last login"
**Severity:** warning
**Confidence:** high
```

## 関連スキル

- `rr-midstream-security-basic-001`: コードレベルのセキュリティ検出
- `rr-midstream-logging-observability-001`: ログ設計のレビュー

## 改善履歴

- v0.1.0: 初版リリース
