# Project Codex Instructions (CODEX_HOME scoped)

> **Single source:** 共通ルールは [AGENTS.md](../AGENTS.md)。本ファイルは Codex 向けの最小差分です。

## Usage

Run Codex with project-local config:

```bash
CODEX_HOME=$(pwd)/.codex codex "your prompt"
```

## Kickoff snippet（最初に貼る推奨プロンプト）

```text
あなたはこのリポジトリの実装エージェントです。着手前に AGENTS.md を読み、完了条件とポリシーを確認して短い計画を示してください。
- ブランチはタスク単位。PR 前に `npm test` と `npm run lint` を実行し、Gemini/Codex レビュー依頼を本文に記載する。
- セルフレビューで残タスクがないことを確認する。
- 秘密情報や `.env*` は扱わない。
```

## Codex-specific settings

- Config: `.codex/config.toml`（approval policy / sandbox）
- Environment: forward-limited (PATH, HOME, USER, SHELL, LANG, LC_ALL)

## Quick reference

- Skills: `skills/` を英日両方のキーワードで検索
- Safety: 秘密情報へのアクセスは禁止。破壊的なコマンドは明示的に確認を求める。
- Workflow: 小さな変更 → `npm test` / `npm run lint` → PR

