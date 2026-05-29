# GitHub Actions で River Reviewer をセットアップする

以下は River Reviewer を GitHub Actions で実行する最小ワークフロー例です。`.github/workflows/river-reviewer.yml` などのファイル名で配置してください。

> **⚠️ 重要**: フォークされたリポジトリからの PR では、GitHub がセキュリティ上の理由でリポジトリの secrets を公開しません。外部コントリビューターの PR でレビューを実行する場合は、`pull_request_target` などのイベント選択と権限設定を検討してください。

```yaml
name: River Reviewer
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
jobs:
  river-reviewer:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - name: Run River Reviewer (midstream)
        uses: s977043/river-reviewer/runners/github-action@v0.68.0
        with:
          phase: midstream # upstream|midstream|downstream
          dry_run: true # 外部 API を呼ばずに PR コメントを投稿する（フォールバック）
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

PR へのコメント投稿には `issues: write` が必要です。権限不足の場合は workflow の `permissions` を見直してください。

> 例では `@v0.68.0` に固定しています。新しいリリースが出た場合はそのタグへ置き換えてください。安定動作のため、可能な限りリリースタグへピン留めしてください。

## Anthropic (Claude) を使う場合

`.river-reviewer.json` で `claude-*` モデルを指定し、`ANTHROPIC_API_KEY` を渡します。

```yaml
- name: Run River Reviewer (midstream, Claude)
  uses: s977043/river-reviewer/runners/github-action@v0.68.0
  with:
    phase: midstream
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

```json
{
  "model": {
    "provider": "anthropic",
    "modelName": "claude-sonnet-4-6",
    "temperature": 0
  }
}
```

`RIVER_ANTHROPIC_API_KEY` を fallback として参照するため、他のツールとキーを分けたい場合はそちらを使っても動作します。
