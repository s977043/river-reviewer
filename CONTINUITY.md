Goal（成功条件を含む）:

- Issue #274 に沿ってスキル定義を YAML Frontmatter + Markdown に統一し、ディレクトリを平坦化してスキルローダーを更新する。

Constraints / Assumptions:

- リポジトリの AGENTS.md に従い、変更前後に lint/test を実行する。
- YAML Frontmatter で id を最優先に扱う新しいローダー実装が必要。
- スキルの Guidance は簡潔に（目安 10 行以内）。

Key decisions:

- skill-loader はデフォルトで `agent` タグを除外し、必要に応じて `excludedTags` で制御する。

State:

- Done: 既存の skill-loader 実装・スキル定義構造・スキーマ/テストを調査。gray-matter を npm 追加。skill 型/スキーマに priority/trigger を含む frontmatter ベースの定義を追加。skill-loader を gray-matter 化し、再帰探索/重複 id スキップ/エラーハンドリング/agent タグ除外を実装。skill.yaml/agent SKILL.md を frontmatter + Markdown へ移行し、skills/ を平坦化、registry/docs/tests を更新。`npm test`/`npm run lint` 成功。
- Now: 変更内容の整理とコミット/PR 生成準備。
- Next: PR メッセージ作成と最終確認。

Open questions（必要なら UNCONFIRMED）:

- なし。

Working set（files / ids / commands）:

- runners/core/skill-loader.mjs（gray-matter パース・重複/エラーハンドリング）
- skills/upstream/_.md, skills/midstream/_.md, skills/agent-\*.md（新フォーマットのスキル定義）
- skills/registry.yaml, skills/README.md, skills/agent-skills/README.md（パス/フォーマット更新）
- tests/skill-loader.test.mjs（エラースキップ・重複検証の追加）
- package.json / package-lock.json（gray-matter 依存追加）
- schemas/skill.schema.json, src/lib/skillYamlSchema.mjs, src/types/skill.ts（スキーマ/型更新）
- pages/reference/skill-metadata*.md, pages/reference/metadata-fields*.md（priority 追記）
- .markdownlintignore（node_modules 配下除外）
