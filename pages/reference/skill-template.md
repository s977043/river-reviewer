---
id: skill-template
---

# スキルテンプレート

新規スキル作成のベーステンプレートは`skills/_template.md`に配置しています。

- 手順の詳細: `../guides/add-new-skill`
- 仕様とメタデータ: `./skill-metadata`

## テンプレート構成

テンプレートは以下のセクションで構成されています。

### Pattern declaration（パターン宣言）

スキルが採用する設計パターンを宣言します。レビュースキルのデフォルトはReviewerです。

| パターン     | 主な用途                                                         |
| ------------ | ---------------------------------------------------------------- |
| Reviewer     | チェックリストや基準に照らした評価（レビュースキルのデフォルト） |
| Inversion    | 不足情報がある場合に生成を止めるゲート                           |
| Pipeline     | 複数ステップの順序制御とチェックポイント                         |
| Tool Wrapper | 専門知識をオンデマンドで注入                                     |
| Generator    | テンプレートから構造化出力を生成                                 |

### Pre-execution Gate（実行前ゲート）

スキルの実行可否を判定する硬い条件です。条件が満たされない場合、スキルは`NO_REVIEW`を返し、レビューコメントを一切生成しません。

False-positive guards（抑制条件）との違い:

- **Gate**: 実行するかどうかの判定。条件未達なら一切レビューしない
- **抑制条件**: 実行した上で個別の指摘を出すかどうかの判定

### Execution Steps（実行ステップ）

複雑なスキルで実行順序を明示するためのセクションです。手順飛ばしを防ぎ、出力の安定性を高めます。

Leaf skills（実行スキル）の基本形:

1. **Gate**: 実行前ゲートの条件を確認
2. **Analyze**: ルールに従い差分を分析、根拠を収集
3. **Output**: 出力フォーマットに従い結果生成、Human Handoff条件を評価

Router skills（ルーティングスキル）の基本形:

1. **Classify**: 入力を分類し、該当する専門スキルを選択
2. **Execute**: 選択したスキルを実行（並列実行可能な場合は明記）
3. **Aggregate**: 結果を統合し、重複を除去して優先順位を付ける

## 関連ドキュメント

- パターン設計の詳細: `.claude/skills/skill-creator/references/design-principles.md`
- Claude Codeスキル用テンプレート: `.claude/skills/skill-creator/assets/basic-skill-template.md`
