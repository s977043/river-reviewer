# Gemini instructions (river-reviewer)

> **Single source:** 必ず [AGENTS.md](./AGENTS.md) を読み、共通ルールと完了条件に従ってください。本ファイルは Gemini 向けの薄いラッパーです。

## 必須チェック

- 着手前に受入条件とポリシーを確認し、短い計画を提示してから作業開始。
- ブランチはタスク単位。PR 前に `npm test` と `npm run lint` を実行し、Gemini / Codex へのレビュー依頼を PR に明記。
- 出力・レビューコメントは日本語が基準（別言語指定がある場合のみ例外）。

## Quick reference

- Docs: `pages/` が編集対象。日本語がソース・オブ・トゥルース。
- Commands: `npm test`, `npm run lint`（必要に応じて `npm run agents:validate` / `npm run skills:validate`）。
- Safety: 秘密情報や `.env*` は持ち込まない。破壊的操作は明示。

## Prompt assembly tips

- 最初の system/context に AGENTS.md と本ファイルの要点を含める。
- タスク概要と受入条件、編集予定ファイルと目的を短く列挙する。
- 追加の Gemini 固有調整があれば後段で指定する（重複は避ける）。

> ルール変更や追加の運用メモは `AGENTS.md` に反映し、このファイルは薄いラッパーとして保守してください。
