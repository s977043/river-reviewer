# Riverbed Memory を使用する

:::caution[Draft / 計画中の機能]
このガイドは計画中の機能について説明しています。現在のバージョン (v0) はステートレスであり、Riverbed Memory は実装されていません。以下の手順は将来のバージョンで利用可能になる予定です。
:::

Riverbed Memory は過去のレビューコンテキストを保存し、将来のフローの一貫性を保ちます。

## 手順

1. 決定の記録: Upstream 設計の選択については PR の説明に短いメモを追加し、関連する場合にスキルの指示からリンクする。
2. シグナルの永続化: 承認されたレビュー結果（例: `logs/` やデータベース層）をスキル ID とフェーズをキーとして保存する。
   例えば、`logs/review_outcomes.json` を以下のように保持する:

   ```json
   {
     "skill-123": {
       "phase": "upstream",
       "outcome": "approved",
       "notes": "Design aligns with upstream architecture."
     },
     "skill-456": {
       "phase": "midstream",
       "outcome": "approved",
       "notes": "Code meets performance requirements."
     }
   }
   ```

3. コンテキストの再利用: 新しいスキルを作成する際、重複した警告や矛盾したガイダンスを避けるために、以前の決定を参照する。
4. 古いメモリの期限切れ: 定期的なリズム（例: 毎月）を設定して、古い決定を整理し、前提条件を更新する。

## 運用例（Shared Memory の配置）

AI レビュー運用の Shared Memory を `.river/` 配下に整理する例です。

- Static（変えにくいルール）: `.river/ai-review/static/`
- Dynamic（学習ログ）: `.river/ai-review/dynamic/`

例:

```text
.river/ai-review/
  static/
    overview.md
    bot-commands.md
    config-guide.md
    integration.md
    security.md
    plans-and-costs.md
  dynamic/
    changelog-template.md
    tuning-log.md
```

## 関連

- Riverbed Memory の背景とスコープ: `pages/explanation/riverbed-memory.md`

## グッドプラクティス

- メモリエントリは小さく、アクション指向（何が変わったか、なぜか、そしてフェーズ）に保つ。
- 自動化ツールがレビューアに情報を注入できるように、構造化されたフォーマット（JSON/YAML）を推奨する。
