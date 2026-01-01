Goal (success criteria):

- 新規Issueとして「おみくじ結果の3点セット化 + 7運勢化 + シェア対応」をリポジトリ内に登録し、要件と受け入れ条件を整理する。

Constraints / Assumptions:

- ルートの AGENTS.md 指示（小さい変更・npm テスト/ lint 実行など）に従う。
- コミット前に `npm test` と `npm run lint` を実行し、PR も作成する。
- CONTINUITY.md を最新状態に保つ。

Key decisions:

- Issue のドラフトは `pages/guides/governance/issue-omikuji-epic.md` として追加し、ナビゲーションは `_meta.json` に登録する。

State:

- Done:
  - Issue ドラフトページの追加とメタデータ更新を完了
  - `npm test` と `npm run lint` を実行済み
  - 変更をコミット済み（docs: add omikuji epic issue draft）
- Now:
  - PR 本文をまとめ、make_pr を実行
- Next:
  - 次ターン以降のフィードバックに備えたフォローアップ

Open questions (UNCONFIRMED if needed):

- なし

Working set (files / ids / commands):

- ファイル: CONTINUITY.md, pages/guides/governance/issue-omikuji-epic.md, pages/guides/governance/\_meta.json
- コマンド: `npm test`, `npm run lint`
