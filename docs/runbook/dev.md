# 開発ランブック（ローカル）

## 前提

- Node.js 20.x
- npm

## 初期セットアップ

```bash
npm ci
```

## 日常の検証コマンド

```bash
npm run lint
npm test
npm run agents:validate
npm run skills:validate
npm run agent-skills:validate
```

## よくある詰まりどころ

- `npm run check:links` が失敗する場合:
  - `lychee` が未インストールの可能性。
  - ローカルでは `npm run check:links:local` で内部リンクのみ検証可能。
- Lint エラーが日本語文書で出る場合:
  - `npm run lint:text` の出力に従って文言を修正。

## PR 前チェック

```bash
npm run lint
npm test
```

変更範囲に応じて、次も実行:

```bash
npm run agents:validate
npm run skills:validate
```
