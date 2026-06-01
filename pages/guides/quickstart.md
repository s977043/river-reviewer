# クイックスタート (River Review)

River Review を最小構成で動かすための流れです。

1. リポジトリに `skills/{upstream,midstream,downstream}` を用意し、スキルを Markdown + YAML frontmatter で作成する（`schemas/skill.schema.json` を参照）。各フェーズの意味については [上流・中流・下流フェーズ](../explanation/upstream-midstream-downstream.md) を参照してください。
2. `.github/workflows/river-review.yml` などに GitHub Actions ワークフローを追加する。
3. 認証情報は、既定の GitHub Action では `OPENAI_API_KEY` をリポジトリ Secrets に設定する。追加のトークンが必要になるのは、独自の連携や拡張を行う場合のみ。
4. PR を作成し、指定フェーズのスキルが実行されることを確認する。

最小の Actions 定義は `README.md` のサンプルを参照してください。
