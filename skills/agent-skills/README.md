---
title: Agent Skills Packages
---

このディレクトリは、Agent Skills の参考資料・付属ドキュメントを置く領域です。
スキル定義そのものは `skills/agent-*.md`（YAML frontmatter + Markdown）に平坦化されました。
ここにはチェックリストなどの `references/` のみを残しています。

## 構成ルール

- 1 スキル = 1 フォルダ（例: `skills/agent-skills/architecture-review/`）で references/ を管理
- スキル定義本体は `skills/agent-*.md` に移動（YAML frontmatter + 本文）

## 収録スキル

- `architecture-review/`: 変更の全体設計・境界・責務のチェック
- `code-quality/`: 可読性・保守性の基本チェック
- `test-coverage/`: 変更に対するテスト不足の検知
- `code-review/`: PR 向けのセキュリティ・性能・品質・テスト観点レビュー
- `code-refactoring/`: 挙動を変えずに設計を整えるための手順ガイド
- `qa-regression/`: Playwright を用いた主要フローの回帰テスト設計と実行
- `code-documentation/`: 目的や使い方を短時間で伝えるドキュメント整備ガイド
- `webapp-testing/`: Playwright を用いた Web アプリケーションの対話・テストツールキット
- `agentcheck-code-review/`: AgentCheck ベースでローカルリポジトリを走査するコードレビュー
