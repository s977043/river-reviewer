# Claude Code から River Reviewer を使う

## 概要

Claude Code から River Reviewer にレビューを依頼する方法は3つあります。それぞれ使う場面や実行コストが異なるため、目的に応じて使い分けてください。

## 方法1: `/review-local` コマンド（最速）

Claude Code のスラッシュコマンドとして使います。現在の作業ツリーの diff を Claude が直接レビューします。

```text
/review-local
```

**特徴:**

- 外部 LLM を呼ばず、即座に動作する
- `git diff`・`git status`・`git log` のみを使用する
- River Reviewer のスキルルールに基づいてレビューする

**適している場面:** commit する前にサッとチェックしたいとき。

---

## 方法2: `river-reviewer` sub-agent に依頼する

Claude Code の Agent ツールが `.claude/agents/river-reviewer.md` の定義を読み込み、専用サブエージェントとしてレビューを実行します。外部サービスへの接続は行いません。

Claude Code のプロンプト欄に次のように入力してください。

```text
river-reviewer に現在の diff をレビューしてもらってください
```

または短縮形:

```text
@river-reviewer このブランチの変更をレビューして
```

**特徴:**

- サブエージェントが `git diff` を読み、`skills/` ディレクトリを参照しながらレビューする
- 正確性・セキュリティ・パフォーマンス・保守性を観点にレビューする
- Read / Grep / Glob / Bash (read-only) のみを使用する

**適している場面:** コードを書いた直後、PR を出す前の詳しいレビューが必要なとき。

---

## 方法3: CLI を Bash ツールで実行する（本格レビュー）

`river run .` を Claude Code の Bash ツール経由で実行します。外部 LLM が実際にレビューを行うため、より本格的な指摘が得られます。

**前提条件:** `ANTHROPIC_API_KEY` または `OPENAI_API_KEY` が環境変数に設定済みであること。

```bash
# 基本（midstream フェーズでレビュー）
river run .

# 自動チーム選択（diff の内容とリスク信号でロールを自動決定）
river run . --reviewers auto

# dry-run（API キー不要、スキルヒューリスティックのみ）
river run . --dry-run

# JSON 形式で出力
river run . --output json
```

Claude Code のプロンプト欄から呼び出す場合は次のように入力してください。

```text
river run . --reviewers auto を実行してレビュー結果を教えて
```

**特徴:**

- 外部 LLM によるフルレビューが実行される
- `--reviewers auto` で diff の内容に合わせたレビュアーロールを自動選択する
- `--dry-run` で API キーなしにスキルのマッチ結果だけを確認できる
- `--save` でレビュー結果を `.river/runs/` に保存できる

**適している場面:** 本格的なコードレビューが必要なとき、大きな変更のとき。

---

## 方法の選び方

| 方法            | LLM 使用         | 実行時間 | 適した場面              |
| --------------- | ---------------- | -------- | ----------------------- |
| `/review-local` | Claude Code 自身 | 即座     | commit 前の軽いチェック |
| sub-agent       | Claude Code 自身 | 数秒     | PR 作成前のレビュー     |
| `river run .`   | 外部 LLM         | 30秒〜   | 本格レビュー・CI 連携   |

---

## W チェック（複数 AI の結果を統合する）

他の AI（Codex 等）のレビュー結果と統合したい場合は、`.river/reviews/` に各 AI のレビュー結果 `.md` を置き、次のコマンドを実行してください。

```bash
river run . --ensemble .river/reviews/
```

詳細は [W チェック実践ガイド](./w-check.md) を参照してください。

---

## 関連ページ

- [クイックスタート](./quickstart.md)
- [GitHub Actions セットアップ](./github-actions.md)
- [W チェック実践ガイド](./w-check.md)
