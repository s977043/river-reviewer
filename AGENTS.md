# AGENTS.md—River Reviewer agent guide

River Reviewer は「流れに寄り添う」AI レビューエージェントです。
このリポジトリには、River Reviewer のドキュメント、スキーマ、検証ユーティリティがまとまっています。
人間と AI コーディングエージェントが、安全かつ一貫した変更を行うためのルールをまとめています。

---

## 0. 原則（Single Source）

- この `AGENTS.md` を全エージェント共通の単一ソースとし、各ツール固有ファイルは薄い差分のみを記載する。
- 着手前に「完了条件」とリポジトリポリシーを確認し、短い実行計画を提示してから作業開始。
- 変更はタスク単位でブランチを切り、PR を作成する。具体的なチェック内容やレビュー要件は「## 11. タスク着手チェックリスト」を参照する。
- 小さく変更 → 検証コマンド → PR → Green 確認 → レビュー
- 設定ファイルを真実の源泉とし、フォーマッタ / lint を必ず通す
- 秘密情報は持ち込まない（`.env*` は禁止、例示はダミー値で）

---

## 1. セットアップと共通コマンド（npm 前提）

- 依存導入（CI/再現性重視）: `npm ci`
- ローカル開発インストール: `npm install`
- ドキュメント開発サーバ（Docusaurus）: `npm run dev`
- ドキュメントビルド: `npm run build`
- テスト（Node.js test runner）: `npm test`
- Lint 一式（Prettier / markdownlint / textlint など）: `npm run lint`
- リンクチェック（lychee、別途インストール必要）: `npm run check:links`
  - クイックチェック: `npm run check:links:quick`
  - オフライン（内部リンクのみ）: `npm run check:links:local`
  - **注意:** lycheeは別途インストールが必要です: `brew install lychee` (macOS) または[インストールガイド](https://github.com/lycheeverse/lychee#installation)を参照
- エージェント定義検証: `npm run agents:validate`
- スキル定義検証: `npm run skills:validate`
- Agent Skills 検証: `npm run agent-skills:validate`
- OpenTelemetry トレース検証（必要時のみ）: `npm run trace:validate`
- Planner 評価（任意・オフラインベンチ用）: `npm run planner:eval`

PR/CI では少なくとも `npm test` と `npm run lint` を通し、変更内容に応じて `agents:validate` / `skills:validate` を実行してください。ドキュメント変更時は `npm run check:links` でリンク切れを確認してください。

---

## 2. ディレクトリ構成と編集範囲

主に編集対象:

- `pages/`: Docusaurus 用ソースドキュメント（Diátaxis: tutorials/guides/reference/explanation）
- `skills/`: YAML フロントマター付き Markdown のレビュー「スキル」定義
- `schemas/`: `skill.schema.json`, `output.schema.json` などの JSON Schema
- `scripts/`: `validate-*.mjs`, `fix-dashes.mjs` などユーティリティ
- `tests/`: Node.js test runner 用のテスト
- `.github/`: GitHub Actions 等の CI 設定

慎重に扱う/原則手動編集しない:

- `docs/`: 公開用生成物を想定。編集は通常 `pages/` 側で行う
- `assets/`: 各種アセット
- `LICENSE*`, `CITATION.cff`: ライセンス/引用情報
- `package-lock.json`: `npm ci` で再生成。手作業で書き換えない

AI エージェントは「主に編集対象」を優先し、それ以外は必要最小限にとどめてください。

---

## 3. 技術スタック

- **Runtime**: Node.js 20+
- **Package Manager**: npm (lockfile: `package-lock.json`)
- **Test Runner**: `node --test` (built-in)
- **Documentation**: Docusaurus 3 (in `pages/`) - _SSOT is Japanese_
- **Linting & Formatting**:
  - Code: `prettier`, `eslint` (config: `.eslintrc.js`)
  - Markdown: `markdownlint` (config: `.markdownlint.json`), `textlint` (Japanese grammar)
  - English: `vale` (prose style)

---

## 4. コーディング / ドキュメントスタイル

- フォーマット: Prettier (`**/*.{js,json,md,yml,yaml}` 対象). 設定は `.prettierrc.json`

- JavaScript/Node: ESM, `node --test` を使用
- Markdown: `markdownlint` ルールは `.markdownlint*.json[c]`; 日本語は `textlint` + `prh` に従う
- ドキュメント言語ポリシー: 日本語がソース・オブ・トゥルース。英語版は `*.en.md` がありうるが差分がある場合は日本語優先
- 必ず `npm run lint` を通してから PR

---

## 5. スキルとエージェント定義に関するルール

### スキル定義（`skills/`）

- 形式: YAML フロントマター付き Markdown
- 主なフィールド: `id`, `name`, `description`, `phase`, `applyTo`, `inputContext`, `outputKind`, `modelHint`, `dependencies`, `tags`, `severity` など（詳細は `docs/skill-metadata.md`）
- 変更後に実行: `npm run skills:validate` および `npm test`（該当があれば）

### Agent Skills パッケージ（`skills/agent-skills/`）

- 形式: `SKILL.md` + `references/` を基本とするフォルダ単位
- 変更後に実行: `npm run agent-skills:validate`（必要に応じて `npm test`）

### エージェント/トレース

- エージェント設定やトレース関連を触ったら `npm run agents:validate`
- 必要に応じて `npm run trace:validate` で OpenTelemetry 経由の挙動確認

---

## 6. コミット / PR ルール（簡易まとめ）

詳細は `CONTRIBUTING.md` を参照。最低限:

- コミット前に: `npm test`, `npm run lint`, 変更に応じて `agents:validate` / `skills:validate`
- PR本文に: 目的 / 変更内容 / 影響範囲 / 実行コマンドと結果を記載

---

## 7. セキュリティ

- `.env*` はコミットしない（例示はダミー値で）
- 外部 API を呼ぶ場合はタイムアウトと例外処理を必須にする

---

## 8. 並行タスクは Git Worktree で分離する

**目的と基本方針:**

- **目的:** 開発プロセスにおける並行タスクの管理を改善し、ブランチ切り替えによるコンテキストスイッチのコストや未コミット変更の混入リスクを排除する。
- **基本方針:** 異なるコンテキスト（機能実装、緊急修正、PR レビューなど）を持つタスクは、必ず物理的に分離された Worktree で実行する。

**並行実行の判断基準:**

- 現在の作業ディレクトリの状態（中断できないプロセスや未コミットの変更）を維持したまま、別のブランチを参照・修正する必要がある場合。
- 複数の独立したタスクを短期間にスイッチしながら進める場合。

**運用規約:**

- **ディレクトリ構成:** 原則としてプロジェクトルートの親階層、または `.git` 除外設定済みの `.worktrees/` ディレクトリを使用する。
  - 推奨パス: `../<project-name>-worktrees/<feature-name>`
- **ブランチ命名:** 既存のプロジェクト規則（`feature/`, `fix/` など）を遵守する。

**標準的な進め方 (Standard Procedure):**

1. **作成:** 新しいタスク用のブランチと Worktree を作成する。

   ```bash
   git worktree add -b <new-branch-name> <path> main
   ```

2. **作業:** 生成されたディレクトリへ移動し、該当タスクを完遂する。
3. **検証:** 独立した環境でビルド・テストを行い、他の作業中の変更と干渉しないことを確認する。

**クリーンアップ手順:**

- タスク完了（マージまたは PR 作成）後は、速やかに Worktree を削除しリソースを解放する。

  ```bash
  git worktree remove <path> && git branch -d <branch-name>
  ```

- 定期的にメタデータの整合性を保つため `git worktree prune` を実行する。

---

## 9. スキル検索戦略

スキルは日本語で記述されていますが、英語プロンプトでも活用できるよう以下のルールに従ってください:

- 英語と日本語の両方のキーワードで `skills/` を検索する
- 英語検索で見つからない場合、主要な用語を日本語に翻訳して再検索する
- ファイル名や `id` フィールドには英語ヒントを含むことが多い
- 検索コマンド例: `rg -i "keyword" skills/` または `fd skill.md skills/`

---

## 10. AI コーディングエージェント向けメモ

- このリポは「AI レビューエージェント」そのものの定義・スキルを含む。仕様変更前に `schemas/*.json` と既存 `skills/` の整合を確認。
- 大きな変更は小さく刻み、必ずテストと検証スクリプトで裏を取ってから PR。
- 不明な場合は README と `docs/architecture.md`（Planner/Runner 概要）、`docs/skill-planner.md` を参照。
- **LLM 有効判定の共通化**: LLM 機能（スキル選択、プランナーなど）を実装・変更する際は、`src/lib/utils.mjs` の `isLlmEnabled()` を使用すること。これは OpenAI (`OPENAI_API_KEY`, `RIVER_OPENAI_API_KEY`) および Google Gemini (`GOOGLE_API_KEY`) の両方のキーを適切にチェックする。

---

## 11. AI プロバイダー別設定

本リポジトリは複数の AI コーディングアシスタントに対応しています。

| プロバイダー   | 設定ファイル                      | カスタムコマンド          | エージェント      |
| -------------- | --------------------------------- | ------------------------- | ----------------- |
| GitHub Copilot | `.github/copilot-instructions.md` | `/skill`, `/review`       | `@river-reviewer` |
| Claude Code    | `CLAUDE.md`, `.claude/`           | `/skill`, `/review-local` | `river-reviewer`  |
| Google Gemini  | `GEMINI.md`                       | -                         | Gemini CLI / Chat |
| OpenAI Codex   | `.codex/`                         | -                         | -                 |

**起動方法:**

- **Copilot**: VS Code で自動読み込み
- **Claude Code**: `claude` コマンドで起動
- **Gemini**: CLI/Code Assist で `GEMINI.md` を参照し、system プロンプトを組む
- **Codex**: `CODEX_HOME=$(pwd)/.codex codex "your prompt"` で起動

各プロバイダー固有ファイルは、この `AGENTS.md` を前提にツール固有の差分だけを薄く追記してください（ドリフト防止）。
共通ルール（スキル利用、安全規則、ワークフロー）はこの `AGENTS.md` が Single Source of Truth です。

---

## 12. タスク着手チェックリスト

- 受入条件とリポジトリポリシーを確認し、短い計画を示してから着手する。
- タスク単位でブランチを作成し、PR に目的と関連 Issue を明記する。
- PR 前に `npm test` と `npm run lint` を実行（必要に応じて `npm run agents:validate` / `npm run skills:validate`）。
- PR 本文で Gemini / Codex へのレビュー依頼を行い、セルフレビューで残タスクがないことを確認する。

---

## 13. プラットフォーム固有の注意事項

### Windows (WSL) での開発

- **UNC パスの制約**: ファイルを `\\wsl.localhost\Ubuntu\...` のような UNC パス経由で参照している場合、`husky` (pre-commit hook) や `prettier` などの一部のツールが CMD.EXE で実行される際にエラー（UNC パス非対応）になることがある。
- 推奨:
  - Git 操作や npm スクリプトは WSL ターミナル内（`/home/<user>/...`）で実行する。
  - 制約のある環境でやむをえずコミットする場合は `git commit --no-verify` を使用し、CI での検証に委ねる。
