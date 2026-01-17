# AIレビュー統合方式（Static）

## A. SaaS 版（アプリ導入 + webhook/event）
- AIレビューサービスを GitHub アプリとして導入し、PR イベントで自動レビューを実行する。
- レビュー設定ファイルでレビュー挙動と要約フォーマットを統制する。
- SaaS 側の設定は、最小権限と対象リポジトリの限定を前提とする。

### 使いどころ
- 公式サポートを優先したい場合
- OSS 版の保守が難しい場合

## B. GitHub Actions（OSS 版/自前運用）
- PR レビュー用の GitHub Actions を自前で実行する。
- OSS 版がアーカイブ/メンテ薄い場合は **SaaS 版を第一候補**とし、
  継続するなら **社内フォーク固定 + 依存更新責任**を明確化する。

### GitHub Actions 雛形（疑似コード）
```yaml
name: AI Review
permissions:
  contents: read
  pull-requests: write
on:
  pull_request:
    types: [opened, reopened, ready_for_review, synchronize]
concurrency:
  group: ${{ github.repository }}-${{ github.event.number || github.head_ref || github.sha }}-${{ github.workflow }}
  cancel-in-progress: true
jobs:
  review:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: Masatake3/river-reviewer/runners/github-action@main
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        with:
          language: ja-JP
          review_simple_changes: false
          review_comment_lgtm: false
          path_filters: |
            !**/*.lock
            !**/dist/**
```

## River-Reviewer 側の設計ガード
- **大規模 PR**: 要約優先・重要パスのみ深掘りに自動切替。
- **コメント過多**: 抑制モードへ切替し、要約中心にする。
- **PR イベント頻発**: idempotency を持たせ、二重投稿を防止する。

## 運用例
- チームで OSS 版を使う場合は、
  1) 社内フォーク固定 2) Actions 権限最小化 3) 設定の共通テンプレ化
  をセットで運用する。
