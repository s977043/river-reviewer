# River Review をはじめる

River Review は、ソフトウェア開発ライフサイクルのためのフローベースの AI レビューエージェントです。上流（Upstream）の設計から中流（Midstream）の実装、下流（Downstream）の QA までをカバーします。

このチュートリアルでは、GitHub Actions を使用して最初のレビューを実行する手順を説明します。

## 1. インストール / 有効化

以下のワークフローを追加してください:

```yaml
name: River Review
on:
  pull_request:

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: s977043/river-review/runners/github-action@v0.70.0
        with:
          phase: midstream
          dry_run: true # 外部 API を呼び出す場合は false に設定
          debug: true # マージベース、トークン見積もり、プロンプトプレビューを表示
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

> 安定性のために `@v0.70.0` のようなリリースタグを指定してください。

## 2. レビューの実行

PR（プルリクエスト）を作成してください。River Review は自動的に以下を行います:

- 変更されたファイルの検出
- 関連スキルの読み込み
- スキーマの検証
- 構造化されたレビューコメントの出力

これでフローに乗る準備が整いました。

## 3. 結果の確認

PR が作成されると、Actions ワークフローが自動的に実行されます。結果は次の 2 か所で確認できます:

- **PR のコメントスレッド** — River Review がレビューコメントを直接 PR に投稿します（`dry_run: false` の場合）。
- **Actions のログ** — ワークフロー実行ページでトークン見積もり、スキル読み込み結果、スキーマ検証の詳細を確認できます（`debug: true` の場合）。
