# AI エージェントから River Reviewer を使う

## 概要

River Reviewer は CLI ベースのツールなので、Claude Code / Cursor / Codex CLI / GitHub Copilot などどの AI エージェントからも利用できます。エージェントの種類に関わらず、`river run .` コマンドを呼び出すだけで動きます。

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

---

## エージェント別の呼び出し方

| エージェント   | 呼び出し方                                | 専用定義ファイル                            |
| -------------- | ----------------------------------------- | ------------------------------------------- |
| Claude Code    | Bash ツール / `/review-local` / sub-agent | `.claude/agents/river-reviewer.md`          |
| Cursor         | Terminal タブ / `@terminal`               | —                                           |
| Codex CLI      | `codex exec "river run ."`                | —                                           |
| GitHub Copilot | ターミナルで直接実行                      | `.github/agents/river-reviewer.agent.md`    |
| その他         | シェルで `river run .`                    | `agents/examples/river-reviewer.agent.yaml` |

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
river-reviewer に現在の diff をレビューしてもらってください
```

専用定義: `.claude/agents/river-reviewer.md`

### Cursor

Cursor の Agent モードからターミナルコマンドとして呼び出せます。

```bash
river run . --reviewers auto
```

### Codex CLI

```bash
codex exec "river run . --reviewers auto"
```

### GitHub Copilot

`.github/agents/river-reviewer.agent.md` が定義済みです。ターミナルで `river run .` を実行するか、Copilot に「`river run .` を実行してレビュー結果を確認して」と指示してください。

### その他のエージェント

シェルコマンドが実行できる環境であれば、`river run .` をそのまま呼び出せます。

---

## Agent Skills（エージェント横断の skill 定義）

`skills/agent-skills/` に**エージェント非依存の skill 定義**があります。どのエージェントにも渡せます。

| Skill                         | 用途                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `river-reviewer`              | メインレビュー（intent 分類 → 専門 skill へのルーティング） |
| `river-reviewer-code`         | コードレビュー特化                                          |
| `river-reviewer-security`     | セキュリティレビュー                                        |
| `river-reviewer-testing`      | テストカバレッジ                                            |
| `river-reviewer-architecture` | アーキテクチャレビュー                                      |
| `adversarial-review`          | 逆張りレビュー（前提を疑う）                                |

エージェントに skill を渡す際は、`skills/agent-skills/<skill-name>/SKILL.md` を読み込ませてください。

---

## W チェック（複数 AI の結果を統合する）

複数のエージェントのレビュー結果を統合したい場合は、W チェックを使ってください。詳細は [W チェック実践ガイド](./w-check.md) を参照してください。

---

## 関連ページ

- [クイックスタート](./quickstart.md)
- [GitHub Actions セットアップ](./github-actions.md)
- [W チェック実践ガイド](./w-check.md)
