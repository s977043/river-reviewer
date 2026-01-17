# Gemini instructions (river-reviewer)

> **Single source:** 必ず [AGENTS.md](./AGENTS.md) を読み、共通ルールと完了条件に従ってください。本ファイルは Gemini 向けの薄いラッパーです。

## 必須チェック

- 着手前に「完了条件」とリポジトリポリシー (`AGENTS.md`) を確認し、計画を提示してから作業開始。
- ブランチはタスク単位。PR 前に `npm test` と `npm run lint` を実行し、レビュー依頼を明記。
- 出力は日本語が基準。

## Gemini-specific Tips

### Prompt assembly

- 最初のコンテキストに `AGENTS.md` の全文（または要約）を含める。
- 本ファイル (`GEMINI.md`) は、Gemini 固有の振る舞い調整が必要な場合のみ参照する。
- タスク概要、受入条件、編集対象ファイルを明確にする。

### Development Tips

開発上のヒントやプラットフォーム固有の注意事項（WSL対応など）については、[AGENTS.md](./AGENTS.md) の「10. AI コーディングエージェント向けメモ」および「13. プラットフォーム固有の注意事項」を参照してください。

> ルール変更や運用メモは `AGENTS.md` に集約し、このファイルは最小限に保ってください。
