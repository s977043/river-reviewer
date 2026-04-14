---
description: 多 PR マージや引き継ぎ作業を開始する前に、対象タスクが obsolete / 並行実施中でないか検証する
argument-hint: '<keyword or PR numbers> [additional context]'
allowed-tools: Bash(gh pr list:*), Bash(gh pr view:*), Bash(gh api:*), Bash(gh issue view:*), Bash(git fetch:*), Bash(git log:*)
---

作業開始前の検証: 「$ARGUMENTS」に関連するタスクが既に完了/不要/並行実施されていないか確認する。

このスキルは書き込み系ツール (Edit / Write / git commit / gh pr create) を実行する **最初の tool call の直前** に呼び出すことを想定している。抽象的な注意喚起ではなく、検証コマンドを具体的に実行して判定まで行う。

## 前提

以下のような作業シグナルがあれば `/preflight` を先に実行する:

- 引き継ぎ情報として複数 PR のマージ指示を受けた
- main 修正 / CI 失敗の解消タスクを開始しようとしている
- 新しい PR を作成しようとしている
- `gh pr list` の結果を信頼して作業計画を立てようとしている
- `.github/workflows/*.yml` の `node-version` / action pin / `permissions` を変更する PR を作ろうとしている（Node baseline / action version / permissions 系の並行 PR と衝突しやすい）

## 調査手順

### Step 1. 引数からキーワードを抽出

引数から 1-3 個の検索キーワードを抽出する (例: "husky chmod" → `husky`, "riverbed memory v1" → `riverbed`, `memory`)。PR 番号が与えられた場合はそれを直接使う。

### Step 2. main の最新状態を取得

```bash
git fetch origin main
git log origin/main --oneline -15
```

直近 15 コミットで関連キーワードが含まれていないか目視確認。

### Step 3. 対象 PR の state を REST API で直接検証

PR 番号が指定されている場合は、1 件ずつ:

```bash
gh api repos/OWNER/REPO/pulls/{N} --jq '{number, state, merged, merged_at, mergeable, mergeable_state}'
```

**重要**: `gh pr view` や `gh pr list` は GraphQL 経路でキャッシュ遅延がある。`merged: false, state: open` と表示されても実際には merged の場合があるため、必ず REST API (`gh api`) で裏取りする。

### Step 4. 並行 in-flight PR の検索

```bash
gh pr list --state open --search "<keyword>" --json number,title,headRefName,author
```

キーワードに該当する open PR を列挙。別の作業者/セッションが同じ問題に取り組んでいないか確認。

### Step 5. 直近 close 済 PR の検索

```bash
gh pr list --state closed --search "<keyword>" --limit 5 --json number,title,mergedAt,closedAt
```

直近の close は「並行作業が merge された直後」の可能性が高いシグナル。5 件以内の close がヒットしたら内容を確認。

### Step 6. 既存 issue / Epic の state 確認 (関連 issue 番号がある場合)

```bash
gh api repos/OWNER/REPO/issues/{N} --jq '{state, closedAt, title}'
```

## 判定

検証結果に基づいて以下のいずれかで応答する:

### A. SAFE — 作業開始可能

条件:

- 対象 PR が全て OPEN かつ未 merge
- 類似 in-flight PR なし
- 直近 close 済 PR に該当内容なし
- main に関連コミットなし

対応: ユーザーに SAFE 判定を報告し、作業を開始する。

### B. OBSOLETE — タスクが不要

条件:

- 対象 PR が既に merged (REST API で確認)
- main に同内容のコミット既に存在
- 関連 Issue/Epic が既に CLOSED

対応:

1. obsolete の根拠 (merge commit hash、close 日時) を提示
2. 作業を**停止**し、ユーザーに「このタスクは既に完了しています」と報告
3. ユーザーの承認なしに cleanup (close / revert 等) を実行しない

### C. PARALLEL_WORK_DETECTED — 並行作業中

条件:

- 類似キーワードの open PR が存在
- 直近 close 済 PR が同一内容
- 別ブランチで同じファイルが変更されている

対応:

1. 並行 PR の番号・タイトル・作成者・状態を提示
2. 作業を**停止**し、ユーザーに「並行作業あり、このタスクを続行しますか?」と確認
3. 並行 PR の merge 待ち / 並行 PR を close / 自分のタスクを close のいずれを選ぶか指示を仰ぐ

### D. PARTIAL — 一部のみ obsolete/並行

複数 PR のタスクで一部のみ不要なケース。

対応: タスクを PR 単位で分解し、各 PR について A/B/C 判定を明示。ユーザーに「有効な PR は N 件、残りは B/C のためスキップ」と報告。

## 禁止事項

- `gh pr list` の結果のみで state を信頼してはならない (必ず `gh api` で裏取り)
- 検証を省略して Edit / Write / git commit / gh pr create に進んではならない
- B (OBSOLETE) / C (PARALLEL) 判定のまま**ユーザー確認なしに**作業を続行してはならない
- 「多分大丈夫」という推測で SAFE 判定してはならない

## なぜこのスキルが必要か

2026-04-11 のセッションで、同じ原因による重複 PR 作成を 4 回繰り返した (#485, #489, #492, #496)。いずれも `gh pr list` のキャッシュ遅延と並行作業の見落としが原因。`feedback_verify_task_still_needed.md` に memory 保存したが新タスク開始時に能動参照されなかったため、**memory ではなく実行可能なスキルとして強制**する必要があると判断した。
