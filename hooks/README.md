# 共通hookスクリプト

ツール非依存の共通スクリプトを格納するディレクトリーです。
各AIコーディングツールからラッパー経由で呼び出されます。

## スクリプト一覧

| スクリプト  | 用途                         | 呼び出し元                |
| ----------- | ---------------------------- | ------------------------- |
| `format.sh` | 変更ファイルにPrettierを実行 | `.claude/hooks/format.sh` |

## 各ツールでの強制方法

| 強制ポイント | 全ツール共通              | Claude Code              | Copilot             |
| ------------ | ------------------------- | ------------------------ | ------------------- |
| フォーマット | `npm run format`          | PostToolUse hook（自動） | VS Code保存時       |
| Lint         | `npm run lint`            | `/check`コマンド         | `/review`プロンプト |
| テスト       | `npm test`                | `/check`コマンド         | CI                  |
| スキル検証   | `npm run skills:validate` | CI                       | CI                  |

## 設計方針

- **npm scripts**が最大公約数（全ツールから実行可能）
- **CI（GitHub Actions）** が最終防衛線
- **ツール固有hooks**は追加の自動化レイヤー
- 共通スクリプトはこの`hooks/`に配置し、ツール固有設定からはラッパーとして呼び出す

詳細は[docs/agent-layers.md](../docs/agent-layers.md)の「③ 強制層」を参照してください。
