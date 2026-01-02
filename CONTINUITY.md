Goal（成功条件を含む）:

- GitHub issue #80 「[Epic]AGENTS.md を共通指示の単一ソースにして各エージェントから参照させる」の内容を本リポジトリに合わせて実装し、AGENTS.md を単一ソースとする関連ファイル整備を完了する。

Constraints / Assumptions:

- リポジトリの AGENTS.md など既存のポリシーを遵守する。
- コミット前に `npm test` と `npm run lint` を実行する。
- PR 作成時は Gemini と Codex レビュー依頼を含める。
- ネットワークアクセスは利用可能。
- ユーザーからの追加指示を反映し、各エージェント向けラッパーをより薄くしつつ、AGENTS.md を単一ソースとして強化する。

Key decisions:

- runners/core と runners/node-api 配下の `node_modules` を削除し、lint 対象から依存ドキュメントを外した。

State:

- Done:
  - リポジトリルート AGENTS.md の内容と issue #80 の受入条件を確認。
  - 作業ブランチ `feat/issue-80-agents-single-source` を作成。
  - AGENTS.md に Gemini 行とラッパー最小化の方針を追記し、GEMINI.md を新規作成。
  - `npm test` と `npm run lint` を実行し、成功を確認。
  - runners/core と runners/node-api の `node_modules` ディレクトリを削除。
  - PR（docs: add Gemini wrapper and continuity log）を作成し、Gemini/Codex レビュー依頼を記載。
  - AGENTS.md と各ラッパー（GEMINI.md、CLAUDE.md、.github/copilot-instructions.md、.codex/AGENTS.md）を、Single Source 前提の薄い指示と着手チェックリストで更新。
  - `npm test` と `npm run lint` を再実行し、成功を確認（再度 node_modules を削除済み）。
  - 変更をコミット（docs: refine agent wrappers for single source）。
- Now:
  - PR 本文を更新済み。レビュー待ち。
- Next:
  - レビューコメントや CI 結果に備え、必要に応じてフォローアップする。

Open questions（必要なら UNCONFIRMED）:

- 各エージェント向け薄いラッパーファイルの具体的要件（本リポジトリの既存構成への適用方法）は UNCONFIRMED。

Working set（files / ids / commands）:

- Issue: <https://github.com/s977043/digital-omikuji/issues/80>
- AGENTS.md（リポジトリルート）
- GEMINI.md
