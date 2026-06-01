# AI エージェントから River Review を使う

## 概要

River Review は CLI ベースのツールなので、Claude Code / Cursor / Codex CLI / GitHub Copilot などどの AI エージェントからも利用できます。エージェントの種類に関わらず、`river run .` コマンドを呼び出すだけで動きます。

---

## 共通の基本操作

以下のコマンドは**エージェントの種類に依存しない**共通操作です。

```bash
# ローカルの diff をレビュー
river run .

# 自動チーム選択（diff の内容でロールを自動決定）
river run . --reviewers auto

# dry-run（API キー不要）
river run . --dry-run

# JSON 形式で出力
river run . --output json
```

### `--reviewers auto` の仕組み

`auto` を指定すると、diff の内容を解析してレビュアーロールを自動選択します。常に `bug-hunter` が含まれ、以下のシグナルに基づいて追加ロールが加わります。

| シグナル                                                                                             | 追加されるロール   |
| ---------------------------------------------------------------------------------------------------- | ------------------ |
| config / schema / migration / infra ファイルが変更されている、またはリスク評価済みファイルが存在する | `security-scanner` |
| test ファイルが変更されている、または app ファイルが 3 件以上ある                                    | `test-gap`         |

どのロールが選択されたかは、JSON 出力の `autoSelectedRoles` フィールドで確認できます。

```json
{
  "autoSelectedRoles": ["bug-hunter", "security-scanner", "test-gap"]
}
```

---

## エージェント別の呼び出し方

| エージェント   | 呼び出し方                                | 専用定義ファイル                          |
| -------------- | ----------------------------------------- | ----------------------------------------- |
| Claude Code    | Bash ツール / `/review-local` / sub-agent | `.claude/agents/river-review.md`          |
| Cursor         | Terminal タブ / `@terminal`               | —                                         |
| Codex CLI      | `codex exec "river run ."`                | —                                         |
| GitHub Copilot | ターミナルで直接実行                      | `.github/agents/river-review.agent.md`    |
| その他         | シェルで `river run .`                    | `agents/examples/river-review.agent.yaml` |

### Claude Code

Bash ツール経由で実行できます。

```bash
river run . --reviewers auto
```

スラッシュコマンドとサブエージェントも利用できます。

```text
/review-local
```

```text
river-review に現在の diff をレビューしてもらってください
```

専用定義: `.claude/agents/river-review.md`

### Cursor

Cursor の Agent モードからターミナルコマンドとして呼び出せます。

```bash
river run . --reviewers auto
```

設定テンプレートは `templates/agent-workflow/` を参照してください。

### Codex CLI

```bash
codex exec "river run . --reviewers auto"
```

設定テンプレートは `templates/agent-workflow/` を参照してください。

### GitHub Copilot

`.github/agents/river-review.agent.md` が定義済みです。ターミナルで `river run .` を実行するか、Copilot に「`river run .` を実行してレビュー結果を確認して」と指示してください。

### その他のエージェント

シェルコマンドが実行できる環境であれば、`river run .` をそのまま呼び出せます。

---

## Agent Skills（エージェント横断の skill 定義）

`skills/agent-skills/` に**エージェント非依存の skill 定義**があります。どのエージェントにも渡せます。

| Skill                       | 用途                                                        |
| --------------------------- | ----------------------------------------------------------- |
| `river-review`              | メインレビュー（intent 分類 → 専門 skill へのルーティング） |
| `river-review-code`         | コードレビュー特化                                          |
| `river-review-security`     | セキュリティレビュー                                        |
| `river-review-testing`      | テストカバレッジ                                            |
| `river-review-architecture` | アーキテクチャレビュー                                      |
| `adversarial-review`        | 逆張りレビュー（前提を疑う）                                |

エージェントに skill を渡す際は、`skills/agent-skills/<skill-name>/SKILL.md` を読み込ませてください。

---

## W チェック（複数 AI の結果を統合する）

複数のエージェントのレビュー結果を統合したい場合は、W チェックを使ってください。詳細は [W チェック実践ガイド](./w-check.md) を参照してください。

---

## 関連ページ

- [クイックスタート](./quickstart.md)
- [GitHub Actions セットアップ](./github-actions.md)
- [W チェック実践ガイド](./w-check.md)
