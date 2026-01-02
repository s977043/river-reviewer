Goal (成功条件を含む):

- AGENTS.md に並行タスク管理向けの Git Worktree セクションを追加し、エージェントが迷わず運用できる具体的手順を提供する。

Constraints / Assumptions:

- 既存の AGENTS.md のスタイルと日本語ポリシーに合わせる。
- テストや lint は不要な文書更新のみの変更である。

Key decisions:

- 章番号を繰り上げ、Worktree セクションを新設して既存のセクションを後ろにずらす。

State:

- Done:
  - リポジトリのルート AGENTS.md を確認。
  - Worktree 運用セクションを追加し、章番号を更新。
- Now:
  - PR 用メッセージ準備。
- Next:
  - PR 本文を作成して提出する。

Open questions（必要なら UNCONFIRMED）:

- なし。

Working set（files / ids / commands）:

- ファイル: AGENTS.md, CONTINUITY.md
- コマンド: cat, find, apply_patch
