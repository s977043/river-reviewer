# CLI Architecture

> 内部資料: River Reviewer リポジトリには 2 系統の CLI が並立している。本ドキュメントはコントリビュータ向けに、各系統の責務・対象ユーザー・サブコマンドの境界を整理する。

## 2 系統の CLI

| 系統           | 実体                                                       | npm bin                                             | サブコマンド                                                 | 対象ユーザー                                               |
| -------------- | ---------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| **メイン CLI** | `src/cli.mjs`                                              | `river` / `river-reviewer` (`package.json#bin`)     | `run`, `skills` (`import`/`export`/`list`), `doctor`, `eval` | エンドユーザー、GitHub Action runner                       |
| **Runner CLI** | `runners/cli/src/index.mjs` (`@river-reviewer/cli-runner`) | パッケージ内 `bin/river` のみ (private、npm 未公開) | `review`, `eval`, `create`                                   | リポジトリ内ツール、スキル開発者向け実験的インターフェース |

`runners/cli/package.json` は `"private": true` ではないが、`runners/` 配下の独立 npm package として `commander` ベースで実装されており、ルートの `package.json#bin` からは引き出されていない。実行は `node runners/cli/bin/river …` で行う。

## なぜ並立しているのか

- メイン CLI (`src/cli.mjs`) は GitHub Action 経由で `node ${GITHUB_ACTION_PATH}/dist/index.mjs run <repo>` の形で呼ばれる本番経路 (`runners/github-action/action.yml` L72)。`runners/github-action/dist/index.mjs` は `runners/github-action/src/index.mjs` (これが `src/cli.mjs` を import するシム) を ncc でバンドルした成果物。GitHub Action 入力 (`phase`, `dry_run`, `debug`, `--planner`, `--max-cost`, `--output`) との 1:1 対応が要件。
- Runner CLI (`runners/cli/`) は v0.2 系で導入されたスキル開発者向けの新インターフェース (`review` / `eval` / `create`)。`commander` を採用し、`@inquirer/prompts` でインタラクティブに `create skill` などを提供。GitHub Action 経路には載せていない。

両者は併用前提で、置き換え計画は無い (2026-04 時点)。

## サブコマンド対応表

| 用途                                | メイン CLI                                          | Runner CLI                             |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------- |
| ローカル差分のレビュー実行          | `river run <path>`                                  | `river review [files...]` (簡易確認用) |
| スキルファイル単体の検証            | `river skills list` / `npm run skills:validate`     | `river eval <skill>`                   |
| 全スキル評価                        | `npm run eval:all` (`scripts/evaluate-all.mjs`)     | `river eval --all`                     |
| 新規スキルの雛形生成                | `npm run create:skill` (`scripts/create-skill.mjs`) | `river create skill` (interactive)     |
| Agent Skills の入出力               | `river skills import` / `river skills export`       | (なし)                                 |
| 設定診断                            | `river doctor <path>`                               | (なし)                                 |
| Fixtures eval (must_include checks) | `river eval --cases <path>`                         | (なし)                                 |

「同じ名前で別物」なサブコマンド (`eval`) があるため、ドキュメントでは必ずどちらの CLI かを明示する。

## どちらを使うべきか

- **GitHub Action / 本番ローカル実行 / リリース前検証**: メイン CLI (`river run` / `river skills` / `river doctor`)。`runners/github-action` も内部でこれを呼ぶ。
- **スキルを書く / インタラクティブな雛形生成 / 単発の eval プロトタイプ**: Runner CLI (`river review` / `river eval` / `river create skill`)。
- **CI でのスキーマ検証**: `npm run skills:validate` / `npm run agents:validate` (どちらの CLI も経由しない直接スクリプト)。

## ドキュメント側の参照

- メイン CLI のオプション仕様: `pages/reference/stable-interfaces.md` § "CLI (`river`) リファレンス（最小）"
- Runner CLI のヘルプ: `runners/cli/README.md`
- スキーマ検証コマンドの導入: `pages/reference/runner-cli-reference.md`
- 新スキル作成手順: `pages/guides/add-new-skill.md`

## 既知の境界 / 注意点

- ルートの `package.json#bin` がメイン CLI (`src/cli.mjs`) にしか登録されていないため、`npx river review …` は **Runner CLI ではなくメイン CLI** に解釈され、メイン CLI には `review` コマンドが無いので unknown command エラーになる。Runner CLI を呼ぶ場合は `node runners/cli/bin/river …` あるいは `runners/cli` 内で `npm exec river …` を使う。
- GitHub Action は `runners/github-action/dist/` 配下のバンドル済み JS を実行するため、`runners/github-action/src/**` を変更したら `npm run build:action` で `dist/` を再生成しないと CI の "Action dist freshness" が落ちる (`docs/development/dist-check-rebuild-guide.md` 参照)。
- 両 CLI ともデフォルト `phase` は `midstream`。`RIVER_PHASE` 環境変数はメイン CLI でのみ参照される (Runner CLI は `--phase` 明示が必要)。
- Runner CLI は `commander` の自動 help を使うため、メイン CLI の `printHelp()` (`src/cli.mjs`) と書式が揃っていない。両ヘルプを同期する責務は今のところ無い。
