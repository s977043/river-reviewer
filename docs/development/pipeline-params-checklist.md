# パイプラインパラメータ追加チェックリスト

`generateReview` / `verifyFinding` / `buildPrompt` / `buildExecutionPlan` に新しいパラメータを追加する際は、以下の全 call site を確認すること。

## 背景

パイプラインの関数シグネチャは複数の独立した call site から呼ばれており、単一のパラメータ伝播点が存在しない。新パラメータを追加する際、どこか1箇所の更新を忘れると下流で `undefined` として渡り、機能がサイレントに no-op 化する。PR レビューで検出されるが、事後修正はリベースコストを伴う。

リポジトリ内の検索で `generateReview` は AI client interface (`src/ai/factory.mjs`, `src/core/skill-dispatcher.mjs`) にも存在するが、これらはパイプライン関数ではなく LLM クライアントのメソッドで別物。混同しないこと。

## チェックリスト

### 必須: `generateReview` / `buildPrompt` に新パラメータを追加した場合

- [ ] `src/lib/review-engine.mjs`—関数シグネチャと内部ロジック
- [ ] `src/lib/local-runner.mjs`—`runLocalReview` 内の `generateReview` 呼び出し
- [ ] `src/lib/review-fixtures-eval.mjs`—eval 呼び出し
- [ ] `tests/review-engine.test.mjs`—新パラメータ有無のテスト最低2件
- [ ] `tests/review-eval.test.mjs`—既存の eval テスト
- [ ] `tests/finding-format.test.mjs`—フォーマット検証テスト
- [ ] `tests/integration/local-review.test.mjs`—統合テスト（関連する場合）

### 必須: `verifyFinding` に新パラメータを追加した場合

- [ ] `src/lib/verifier.mjs`—関数シグネチャと checks オブジェクト
- [ ] `src/lib/review-engine.mjs`—`generateReview` 内の `verifyFinding` 呼び出し（`await import('./verifier.mjs')` 箇所）
- [ ] `tests/verifier.test.mjs`—新チェックの pass/fail/lenient 3パターン

### 必須: `buildExecutionPlan` に新パラメータを追加した場合

- [ ] `runners/core/review-runner.mjs`—options destructuring と返却オブジェクト（planner あり/なし両方）
- [ ] `src/lib/local-runner.mjs`—`planLocalReview` の2箇所（main path + collectLocalContext path）の `buildExecutionPlan` 呼び出し
- [ ] plan 経由で下流関数に渡される場合は下流関数のチェックリストも確認

## 確認方法

パラメータ名を決めたら、まず grep で全出現箇所を列挙する:

```bash
rg "generateReview\b" src/ runners/ tests/ scripts/
rg "buildExecutionPlan\b" src/ runners/ tests/ scripts/
rg "verifyFinding\b" src/ runners/ tests/ scripts/
```

各ヒット箇所で「この call site は新パラメータを渡す必要があるか」を判定する。`src/ai/` と `src/core/skill-dispatcher.mjs` の `generateReview` は AI client メソッドで別物のため除外する。

## 設計上の制約

`src/lib/` は AGENTS.md の "Ask before editing" スコープに該当するため、大規模なシグネチャ変更は事前にユーザー承認を得ること。

## 関連

- AGENTS.md の Edit Scope セクション
- `src/lib/review-engine.mjs:generateReview`
- `src/lib/verifier.mjs:verifyFinding`
- `runners/core/review-runner.mjs:buildExecutionPlan`
