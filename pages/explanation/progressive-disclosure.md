# Progressive Disclosure（段階的開示）

## 概要

Progressive Disclosure は、スキルのコンテキストを必要なときに必要な詳細度だけロードする戦略です。

LLM ベースのレビューでは、すべてのスキルを最初からフルロードすると以下の問題が発生します:

- **トークンの浪費**: 選択されないスキルの本文が Context Budget を圧迫する
- **注意力の希薄化**: 重要なスキルの指示が大量の無関係なテキストに埋もれる
- **ルーティングの曖昧性**: ローダーが全スキルの詳細を持つため、選択判断のノイズが増える

## 3 段階モデル

River Reviewer は以下の 3 段階でスキルコンテキストをロードします。

### Stage 1: メタデータ（常時ロード）

スキル一覧の取得とフィルタリングに使用されます。起動時に全スキルファイルから frontmatter のみを抽出します。

**含まれるフィールド:**

- `id`, `name`, `description`
- `phase`, `applyTo` (ルーティング判断)
- `tags`, `severity`
- `inputContext`, `outputKind`
- `modelHint`, `dependencies`, `priority`

**用途:** フェーズフィルタ、ファイルパターンマッチ、コンテキスト要件チェック、依存関係チェック

### Stage 2: インストラクション（選択後にロード）

Planner/Router がスキルを選択した後にロードされます。スキルの Markdown 本文（frontmatter 以降のテキスト）を含みます。

**含まれるフィールド:**

- `body` (Markdown 本文 / レビュー指示)

**用途:** LLM プロンプトへのスキル指示の注入

### Stage 3: 参照コンテキスト（実行時にロード）

Runner がレビューを実行する際に、必要に応じてロードされます。

**含まれるフィールド:**

- `prompt.system`, `prompt.user` (カスタムプロンプト)
- `fixtures/`, `golden/` (テストデータ)
- Riverbed Memory entries (過去の判断)
- Project rules (`.river/rules.md`)

**用途:** レビュー精度の向上、コンテキストの補強

## なぜ 3 段階なのか

```text
全スキル (111+)
  │
  ├── Stage 1: メタデータ → フィルタ → 10-15 スキル候補
  │
  ├── Stage 2: 本文ロード → 選択された 3-5 スキル分のみ
  │
  └── Stage 3: 参照追加 → 実行に必要な補足のみ
```

各段階で情報量を絞ることで、最終的に LLM に渡すコンテキストは「最小で高シグナル」になります。これは Context Budget の効率的な利用と、Attention Budget の集中を両立させます。

## 現在の実装状況

| 項目 | 状態 |
|------|------|
| `loadSkills()` — 全スキルのフルロード | ✅ 既存 |
| `summarizeSkill()` — メタデータのみの要約 | ✅ 既存（Stage 1 の proto 実装） |
| `loadSkillMetadata()` — メタデータ専用ロード | 🔜 追加予定 |
| Stage 2/3 の明示的分離 | 📋 設計済み |

## 関連

- [用語集: Progressive Disclosure](../reference/glossary.md)
- [スキルスキーマ・リファレンス](../reference/skill-schema-reference.md)
- [アーキテクチャ](./river-architecture.md)
