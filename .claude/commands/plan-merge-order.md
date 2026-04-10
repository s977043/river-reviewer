---
description: 複数 PR のマージ順序を事前計画してリベースコストを最小化する
argument-hint: '[PR numbers or branch names]'
allowed-tools: Bash(gh pr list:*), Bash(gh pr view:*), Bash(gh pr diff:*), Bash(git log:*)
---

複数の PR を作成・マージする際の順序を事前計画してください。対象: $ARGUMENTS

## 手順

### 1. 対象 PR の収集

各 PR について以下を取得:

```bash
gh pr diff <number> --name-only
```

変更ファイルリストを記録する。

### 2. 依存グラフの作成

PR 間の関係を3種類に分類:

- **包含関係**: PR A の変更が PR B に全て含まれている → A をマージして B をクローズ
- **ファイル衝突**: 同じファイルを変更する → 先にマージした方の変更を他方がリベースで取り込む必要あり
- **独立**: 変更ファイルが重ならない → 順序に依存しない

### 3. マージ順序の決定

優先ルール:

1. **独立 PR を最初にマージ** — コンフリクトリスクなし
2. **包含される PR を先にマージ** — 上位 PR は後で rebase
3. **ファイル衝突 PR はボトムアップ** — 変更量の少ない PR を先に
4. **hot file を触る PR は特に慎重** — `src/lib/review-engine.mjs`, `src/lib/local-runner.mjs`, `src/lib/verifier.mjs` など

### 4. レポート出力

以下の形式（プレースホルダー）で結果を報告:

```markdown
<!-- 以下は出力テンプレート例。実際の PR 番号・ファイル名・行番号に置き換えて使用 -->

## マージ順序計画

### 依存グラフ

- PR #<number> → PR #<number> （ファイル衝突: <file>, <file>）
- PR #<number> （独立）

### 推奨マージ順序

1. PR #<number>（独立、ファイル衝突なし）
2. PR #<number>（ボトムアップ: 変更量少）
3. PR #<number>（リベース必要: 上流マージ後にファイル X が変更されている）

### リベース予想コスト

- PR #<number>: `<file>:<line>` 付近で約 N 行のコンフリクト見込み
```

## Hot File リスト

以下のファイルは複数 PR で同時に触られやすいため、特に警戒。最新の churn は次のコマンドで確認:

```bash
git log --format= --name-only --since=6.months | sort | uniq -c | sort -rn | head -20
```

現時点の代表例:

- `src/lib/review-engine.mjs` — レビュー生成の中心
- `src/lib/local-runner.mjs` — CLI 実行パス
- `src/cli.mjs` — CLI エントリポイント
- `src/lib/verifier.mjs` — 検証ロジック
- `runners/core/review-runner.mjs` — plan 構築
- `schemas/output.schema.json` — 出力スキーマ

## 禁止事項

- 依存関係を調べずにマージ順序を決めてはならない
- Hot file の複数 PR 同時マージを推奨してはならない
- 「順序は適当で大丈夫」と断定してはならない
