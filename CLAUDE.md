# Claude Code Project Guide

> **Single source:** まず [AGENTS.md](./AGENTS.md) を参照し、共通ルールと完了条件に従ってください。本ファイルは Claude 向けの最小差分です。

## 必須チェック

- 着手前に受入条件とポリシーを確認し、短い計画を提示してから作業開始。
- ブランチはタスク単位。PR では `npm test` と `npm run lint` を実行し、Gemini / Codex へのレビュー依頼を明記する。
- セルフレビューで残タスクがないことを確認してから提出する。

## Claude-specific

- Permission settings: `.claude/settings.json`
- Custom commands: `/skill`, `/review-local` (in `.claude/commands/`)
- Sub-agent: `river-reviewer` (in `.claude/agents/`)
