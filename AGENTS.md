# AGENTS.md—River Reviewer

この`AGENTS.md`は全AIコーディングエージェント共通のルールである。各ツール固有ファイル（`CLAUDE.md`等）は薄い差分のみを記載する。

**このリポジトリの概要:** Skill Registry駆動のAIコードレビューフレームワーク。`skills/`配下のレビュースキル定義がプロダクトの中核であり、`src/`のランタイム、GitHub Actions、CLIはそのスキルを実行するインターフェイスである。アーキテクチャ詳細は`docs/architecture.md`を参照する。

---

## 0. 禁止事項

以下は例外なく禁止する。

- `main`ブランチへの直接push（`git push origin main`を実行しない）
- マージ済みPRブランチへの追加push（修正が必要な場合は新しいブランチと新しいPRを作成する）
- `.env*`、`secrets/`、`*.pem`、`*.key`の読み取り・コミット（例示にはダミー値を使う）
- `package-lock.json`の手動編集
- 外部ネットワークへのアクセス（`curl`、`wget`等）
- 破壊的コマンド（`rm -rf`、`sudo`等）
- 外部APIを呼ぶコードでタイムアウト・例外処理を省略すること

---

## 1. 自律判断の基準

| 条件                                                    | 行動                               |
| ------------------------------------------------------- | ---------------------------------- |
| 変更ファイルが3個以下の見込み、§3「編集対象」のみ       | そのまま実行してよい               |
| 変更ファイルが4個以上の見込み、または複数領域にまたがる | 実行計画を提示してから着手する     |
| §3「要確認」パスを含む（`src/`、`docs/`等）             | ユーザーに許可を求めてから編集する |
| §3「編集禁止」パスを含む                                | 編集しない                         |
| 判断に迷う場合                                          | ユーザーに確認する。推測で進めない |

---

## 2. 着手フロー

タスクを受けたら以下の順で進める。

1. 完了条件を確認する。§1の基準で計画提示が必要なら先に提示する
2. タスク単位でブランチを作成する（`git checkout -b <type>/<description>`）
3. 編集範囲を§3で確認する
4. 変更を小さく刻む（1 PRは論理的に1つの目的）
5. 新規ファイルを作成する場合、同種の既存ファイルのパターンに合わせる
6. §4の検証コマンドを実行し、全パスを確認する
7. PRを作成する（§7の手順に従う）

---

## 3. 編集範囲

### 編集対象

- `pages/`: Docusaurusドキュメント（日本語がSSoT）
- `skills/`: レビュースキル定義（YAMLフロントマター付きMarkdown）
- `schemas/`: JSON Schema（`skill.schema.json`等）
- `scripts/`: 検証・ユーティリティスクリプト
- `tests/`: テストファイル
- `.github/`: GitHub Actions、エージェント定義

### 編集禁止（自動生成・管理外）

- `package-lock.json`: `npm ci`で再生成する
- `LICENSE*`、`CITATION.cff`: ライセンス・引用情報

### 要確認（ユーザーの許可を得てから編集）

- `docs/`: 内部資料。公開コンテンツは`pages/`で管理する
- `assets/`: 各種アセット
- `src/`: ランタイムソースコード。仕様変更前に`schemas/*.json`と既存`skills/`の整合を確認する

---

## 4. 検証コマンド

### 全PR共通（必須）

```bash
npm run lint     # Prettier + markdownlint + textlint
npm test         # Node.js test runner
```

### 変更内容に応じた追加（該当時は必須）

| 変更対象                             | コマンド                        |
| ------------------------------------ | ------------------------------- |
| `skills/**/*.md`                     | `npm run skills:validate`       |
| `skills/agent-skills/**/*.md`        | `npm run agent-skills:validate` |
| `.github/agents/`、`.claude/agents/` | `npm run agents:validate`       |
| `pages/**/*.md`                      | `npm run check:links:local`     |

### 任意

| コマンド                 | 用途                           |
| ------------------------ | ------------------------------ |
| `npm run check:links`    | 全リンク検証（外部含む、低速） |
| `npm run trace:validate` | OpenTelemetryトレース検証      |
| `npm run planner:eval`   | Planner品質ベンチマーク        |

### セットアップ

- 依存導入: `npm ci`（CI/再現性重視）または`npm install`（ローカル開発）
- ドキュメント開発サーバー: `npm run dev`（Docusaurus）
- ドキュメントビルド: `npm run build`
- リンクチェックには別途lycheeが必要: `brew install lychee`（macOS）

---

## 5. 技術スタックとスタイル

- **Runtime**: Node.js 20+、npm（lockfile: `package-lock.json`）
- **Test Runner**: `node --test`（built-in）
- **Documentation**: Docusaurus 3（`pages/`配下）
- **Linting**: `prettier`、`eslint`（`.eslintrc.js`）、`markdownlint`（`.markdownlint.json`）、`textlint`（日本語文法）、`vale`（英語prose）
- **フォーマット**: Prettier（`**/*.{js,json,md,yml,yaml}`、設定は`.prettierrc.json`）
- **JavaScript/Node**: ESM
- **ドキュメント言語**: 日本語（`*.md`）がSSoT。英語版は`*.en.md`。差分がある場合は日本語を優先する

---

## 6. スキルとエージェント定義

### スキル定義（`skills/`）

- 形式: YAMLフロントマター付きMarkdown
- 主なフィールド: `id`、`name`、`description`、`category`（`core`/`upstream`/`midstream`/`downstream`）、`applyTo`、`inputContext`、`outputKind`、`modelHint`、`severity`、`tags`
- 新規作成時は`skills/_template.md`と同カテゴリーの既存スキルを参照する
- 検証: §4の表を参照

### Agent Skillsパッケージ（`skills/agent-skills/`）

- 形式: `SKILL.md` + `references/`を基本とするフォルダー単位

### エージェント定義

- `.claude/agents/`（Claude Code用）、`.github/agents/`（Copilot用）
- 検証: §4の表を参照

---

## 7. コミット/PRルール

詳細は`CONTRIBUTING.md`を参照する。

- コミット前に§4の必須検証を実行する
- PR本文に目的・変更内容・影響範囲・実行コマンドと結果を記載する
- コミットメッセージはConventional Commits（`feat:`、`fix:`等）に従う
- PR作成手順:

```bash
git checkout -b <type>/<description>
git add <files>
git commit -m "<type>: <description>"
git push -u origin <type>/<description>
gh pr create --title "<type>: <description>" --body "..."
```

---

## 8. スキル検索

スキルは日本語で記述されているが、英語プロンプトでも活用できる。

- 英語と日本語の両方のキーワードで`skills/`を検索する
- 英語検索で見つからない場合、主要な用語を日本語に翻訳して再検索する
- ファイル名や`id`フィールドには英語ヒントを含むことが多い
- 検索コマンド例: `rg -i "keyword" skills/`または`fd skill.md skills/`

---

## 9. AI実装メモ

- このリポジトリはAIレビューエージェントそのものの定義・スキルを含む。`src/`を変更する場合は§3「要確認」に従う
- **LLM有効判定の共通化**: LLM機能を実装・変更する際は`src/lib/utils.mjs`の`isLlmEnabled()`を使用する。OpenAI（`OPENAI_API_KEY`、`RIVER_OPENAI_API_KEY`）およびGoogle Gemini（`GOOGLE_API_KEY`）の両方のキーをチェックする
- 不明な場合はREADMEと`docs/architecture.md`を参照する
- 並行タスクにはGit Worktreeを使用する。手順は`docs/runbook/dev.md`を参照する

---

## 10. AIプロバイダー別設定

| プロバイダー   | 設定ファイル                      | カスタムコマンド          | エージェント      |
| -------------- | --------------------------------- | ------------------------- | ----------------- |
| GitHub Copilot | `.github/copilot-instructions.md` | `/skill`、`/review`       | `@river-reviewer` |
| Claude Code    | `CLAUDE.md`、`.claude/`           | `/skill`、`/review-local` | `river-reviewer`  |
| Google Gemini  | `GEMINI.md`                       | -                         | Gemini CLI/Chat   |
| OpenAI Codex   | `.codex/`                         | -                         | -                 |

各プロバイダー固有ファイルはこの`AGENTS.md`を前提にツール固有の差分だけを薄く記載する（ドリフト防止）。
