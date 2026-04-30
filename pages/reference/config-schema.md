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
- `security`（[#692](https://github.com/s977043/river-reviewer/issues/692)）
  - `redact.enabled`: `true`（デフォルト）。LLM へ送る前段で repo-wide context とプロンプトの secret を伏字化する。
  - `redact.categories`: カテゴリ単位で個別 ON/OFF。キーは以下。
    - 鍵類: `githubToken` / `openaiKey` / `anthropicKey` / `googleApiKey` / `awsAccessKey` / `awsSecretKey` / `privateKey`
    - 認証: `bearerToken` / `databaseUrl` / `webhookUrl` / `oauthSecret` / `envAssignment`
    - フォールバック: `highEntropy`
  - `redact.extraPatterns`: 追加正規表現（`{ id, pattern, replacement? }`）。プロジェクト固有の鍵フォーマットに使う。
  - `redact.allowlist`: 一致するトークンは redact しない（テスト固定値などの保護）。
  - `redact.denyFiles`: コンテキスト収集の前段で読み飛ばす glob 追加分（既定の `.env*` / `*.pem` / `*.key` / `secrets.*` 等に上乗せ）。
  - `redact.entropyThreshold`: `3.0`〜`6.0`（既定 `4.5`）。Shannon entropy を使った fallback 検出の閾値。
  - `redact.entropyMinLength`: 既定 `24`。fallback 検出の対象とする最小文字数。
- `memory`（[#687](https://github.com/s977043/river-reviewer/issues/687)）
  - `suppressionEnabled`: `true`（デフォルト）。Riverbed Memory に登録された suppression entry を反映する。`false` で gate を完全バイパス（緊急対応用）。
  - **suppression entry の `feedbackType`** (`schemas/suppression-context.schema.json`):
    - `false_positive`: 誤検知。severity 問わず自動抑止する。
    - `accepted_risk`: リスクを認識した上で残すと決めた指摘。`major` / `critical` の自動抑止には **この値が必須**（HIGH_SEVERITY P1 guard）。
    - `wont_fix`: 修正しないと決めた指摘。`accepted_risk` と同様に severity gate あり。
    - `not_relevant`: 当該 PR / ファイルの文脈で関連が薄い指摘。
    - `duplicate`: 別エントリの fingerprint への参照（`duplicateOfFingerprint` 必須）。
  - CLI: `river suppression add` で対話的に登録できる。
    - 必須フラグ: `--fingerprint <fp>` / `--feedback <type>` / `--rationale <text>`
    - 任意フラグ: `--scope <pattern>` / `--severity <level>` / `--files <glob>` / `--expires <date>` / `--pr <num>`
- `context`（[#689](https://github.com/s977043/river-reviewer/issues/689)）
  - `reviewMode`: `tiny` / `medium` / `large`。budget を省略すると `src/lib/context-presets.mjs` のプリセットを適用する。`budget` を明示するとプリセットより優先される。
  - `budget.maxTokens`: `256`〜`64000`。
  - `budget.maxChars`: `1024`〜`200000`。char 上限と token 上限の両方が同時に効く。
  - `budget.perSectionCaps`: `fullFile` / `tests` / `usages` / `config` ごとの char 上限を個別指定する。
  - `ranking.enabled`: `true` で変更ファイルへの近接度に基づいた候補並び替えを有効化する。
  - `ranking.weights`: `pathProximity` / `symbolUsage` / `siblingTest` / `commitRecency` を `0.0`〜`1.0` で指定する。省略時は等重みを使用する。
  - `tokenizer`: `heuristic` のみ受理する（将来拡張用）。

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
