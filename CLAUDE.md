# Claude Code Project Guide (river-reviewer)

> **Single source:** まず [AGENTS.md](./AGENTS.md) を参照し、共通ルールと完了条件に従ってください。本ファイルは Claude 向けの最小差分です。

## ゴール / 非ゴール

- **ゴール**: River Reviewer のスキル管理とドキュメント整備
- **非ゴール**: 外部 API 連携の実装、UI デザイン刷新

## 技術スタック

- Runtime: Node.js 20+
- Package manager: npm
- Tests: node --test (built-in)
- Docs: Docusaurus (in `pages/`)
- Lint: prettier, markdownlint, vale

## 進め方（Definition of Done）

- 変更は小さく、差分を説明できる単位で
- `npm run lint` と `npm test` が通ること
- 変更理由と影響範囲を PR 本文に書く

## 重要な制約（絶対に守る）

- secrets は触らない（.env / secrets/ は読まない）
- lockfile (package-lock.json) は壊さない
- 既存の public API の互換性を壊さない
- 不明点は推測で突っ走らず、コード根拠から判断する

## よく使うコマンド

- `npm install`
- `npm run lint`
- `npm run format`
- `npm test`
- `git status` / `git diff`

## カスタムコマンド

- `/check` : lint/test を実行し、失敗時は原因と修正案を出す
- `/pr` : PR 本文をテンプレで生成
- `/skill` : スキル定義の作成支援
- `/review-local` : ローカルでのセルフレビュー

## Claude-specific

- Permission settings: `.claude/settings.json`
- Hooks: `.claude/hooks/` (post-edit formatting)
- Sub-agent: `river-reviewer` (in `.claude/agents/`)
