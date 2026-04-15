# コンフィグ / スキーマ概要

## `.river-reviewer.json`（実行時コンフィグ）

リポジトリ直下に置く `.river-reviewer.json` で、レビュー時のモデル設定や除外条件をカスタマイズできる。`src/config/schema.mjs` の Zod スキーマで検証し、存在しない場合は `src/config/default.mjs` のデフォルト値を使用する。

### サポート項目とデフォルト

- `model`
  - `provider`: `openai`（デフォルト）。設定スキーマ上は `google` / `anthropic` も受理されるが、現在のレビューパイプラインは OpenAI 専用である (#490 参照)。
  - `modelName`: `gpt-4o-mini`（デフォルト）
  - `temperature`: `0`
  - `maxTokens`: `600`
- `review`
  - `language`: `ja`（日本語）/`en`（英語）。プロンプトの本文と出力言語を切り替える。
  - `severity`: `normal`（デフォルト）/`strict`/`relaxed`
  - `additionalInstructions`: 追加のレビューポリシー（配列）。プロンプト末尾に列挙される。
- `exclude`
  - `files`: 変更差分から除外する glob パターン。
  - `prLabelsToIgnore`: Pull Request ラベル名に対象キーワードが含まれていればスキップする設定。`RIVER_PR_LABELS`（カンマ区切り）または GitHub Actions の `GITHUB_EVENT_PATH` から取得したラベルと照合し、大文字小文字を無視した部分一致で判定する。

### 設定例

```json
{
  "model": { "provider": "openai", "modelName": "gpt-4o", "temperature": 0.2 },
  "review": {
    "language": "en",
    "severity": "strict",
    "additionalInstructions": ["Focus on security", "Prefer readable variable names"]
  },
  "exclude": {
    "files": ["**/*.md", "docs/**"],
    "prLabelsToIgnore": ["no-review", "wip"]
  }
}
```

### 運用のヒント

- CI でスキップさせたいラベルを `prLabelsToIgnore` に記載し、`RIVER_PR_LABELS`（例: `RIVER_PR_LABELS=no-review,wip`）または GitHub のイベントペイロードから読み取れるようにしておくと安全である。
- 設定変更後は `npm test` や `npm run lint` でスキーマ整合性と挙動を確認する。

## JSON Schema（スキル／出力）

River Reviewer では、スキルや出力を JSON Schema で定義する。スキルは YAML frontmatter、出力は JSON を想定している。

- `schemas/skill.schema.json`
  - 必須: `id` / `name` / `description` / `category` （加えて `phase` / `category` / `trigger` のいずれか、`applyTo` / `files` / `path_patterns` / `trigger` のいずれかが必要）
  - 任意: `tags` / `severity` / `inputContext` / `outputKind` / `modelHint` / `dependencies`
  - `category` は `core` / `upstream` / `midstream` / `downstream` で、ルーティングの第一キー。`phase` は後方互換のため残されている。

- `schemas/output.schema.json`
  - 必須: `issue` / `rationale` / `impact` / `suggestion` / `priority` / `skill_id`
  - `priority` は `P0`〜`P3` のいずれか

スキルは Markdown ファイルとして `skills/{category}/` に配置し、`npm run skills:validate` でスキーマ検証ができる。
