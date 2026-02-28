# Copilot instructions (river-reviewer)

> **Single source:** 必ずリポジトリルートの [AGENTS.md](../AGENTS.md) を先に読み、そこで定義された手順・完了条件に従ってください。本ファイルは Copilot 向けの最小差分です。

## 必須チェック（着手前に確認）

- 目的と受入条件を読み、短い計画をコメントで共有してから作業開始。
- タスク単位でブランチを作成し、PR を用意する。
- PR 前に `npm test` と `npm run lint` を実行。レビュー依頼を PR 本文に記載。
- レビューコメントは日本語で記載する。

## 参照ポイント

- 指示ファイル: `.github/instructions/*.instructions.md`
- カスタムエージェント: `@river-reviewer` (`.github/agents/` 内)
- プロンプト: `/skill`, `/review`, `/pr` (`.github/prompts/` 内)
- Docs: 日本語を正とし、`.en.md` は翻訳版とします。

## 責務分離ルール（肥大化防止）

- `copilot-instructions.md`: 全体で不変に近いルールのみを記載。
- `.github/instructions/*.instructions.md`: パス/言語ごとの実装規約を記載。
- `.github/prompts/*.prompt.md`: 手動実行する定型タスクを記載。
- 変更頻度が高い手順は `docs/runbook/` に集約し、ここへ長文で書かない。
