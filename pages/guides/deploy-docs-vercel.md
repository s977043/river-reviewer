# Vercel で Docs を安定公開する

Next.js と Docusaurus を同じ Vercel プロジェクトに置くと、ルーティング衝突で 404 になることがあります。Docs を別プロジェクトに分け、必要ならアプリ側で `/docs/*` を rewrite する構成にすると安定します。

## 前提とゴール

- 公開 URL は `https://<docs-domain>/` を基本に、必要なら `https://<app-domain>/docs/...` を維持する。
- Docs プロジェクトは Docusaurus をビルドして配信する。
- 404 やリンク切れはビルド・CI で検知して落とす。

## Docs プロジェクト（Vercel）

1. このリポジトリを Vercel の別プロジェクト（例: `river-reviewer-docs`）として追加する。
2. Build Command: `npm run build`、Output Directory: `build` を設定する。
3. 環境変数を追加する。
   - `DOCS_SITE_URL=https://<docs-domain>` （例: `https://river-reviewer-docs.vercel.app`）
   - `DOCS_BASE_URL=/`（省略可。デフォルトは `/`）
   - `DOCS_ROUTE_BASE_PATH=/`（省略可。デフォルトは `/`）
4. `/docs/` からトップへ寄せる場合は、リポジトリ直下の `vercel.json` を利用する。

```json
{
  "trailingSlash": true,
  "redirects": [{ "source": "/docs/", "destination": "/", "permanent": true }]
}
```

`/docs/` 配信にしたい場合は `DOCS_BASE_URL=/docs/` を指定し、リダイレクトも `/` -> `/docs/` に合わせて変更します。
GitHub Pages 向けに `DOCS_BASE_URL` を指定しない場合は、従来どおり `/river-reviewer/` 配信でビルドされます。

## アプリ側（例: `<app-domain>`／`river-reviewer.vercel.app` など）

アプリの `vercel.json` に rewrite を追加し、ドキュメントドメインへ転送します（Docs 側が `/` で公開される前提）。

```json
{
  "rewrites": [
    { "source": "/docs", "destination": "https://<docs-domain>/" },
    { "source": "/docs/:path*", "destination": "https://<docs-domain>/:path*" }
  ]
}
```

## 品質ゲート

- `onBrokenLinks` と `onBrokenMarkdownLinks` は `throw` 設定。壊れた内部リンクや Markdown 内リンクをビルドで検知する。
- `npm run build`（必要に応じて `DOCS_BASE_URL=/docs/ DOCS_ROUTE_BASE_PATH=/` を指定）で配信パスをローカル確認できる。
- リンクチェッカーのワークフローで外部リンク切れも検出し、失敗時は PR をブロックする。
