# レビューアーティファクト（Review Artifact）

River Reviewer のレビュー実行結果を構造化した JSON 出力スキーマです。レビュー計画・コンテキスト・指摘事項・デバッグ情報をひとつのアーティファクトにまとめ、監査・メモリ取り込み・評価パイプラインの入力として利用できます。

## 概要

既存の `output.schema.json` は個別の指摘事項（findings）の形式を定義していますが、レビュー実行全体のメタデータ（どのスキルが実行されたか、どのファイルが対象だったか、プランナーの判断理由など）はカバーしていません。

Review Artifact スキーマは、レビュー実行の完全な記録を提供します。

- **スキーマファイル**: [`schemas/review-artifact.schema.json`](../../schemas/review-artifact.schema.json)
- **JSON Schema Draft**: 2020-12
- **バージョン**: `1`（`version` フィールドで管理）

## フィールド一覧

### トップレベル

| フィールド  | 型                   | 必須 | 説明                                                                                                                |
| ----------- | -------------------- | ---- | ------------------------------------------------------------------------------------------------------------------- |
| `version`   | `string`             | Yes  | スキーマバージョン。現在は常に `"1"`。                                                                              |
| `timestamp` | `string` (date-time) | Yes  | レビュー実行完了時の ISO 8601 タイムスタンプ。                                                                      |
| `phase`     | `string`             | Yes  | レビュー対象の SDLC フェーズ。`upstream` / `midstream` / `downstream`。                                             |
| `status`    | `string`             | Yes  | 実行の終了ステータス。`ok` / `no-changes` / `skipped-by-label` / `error`。                                          |
| `plan`      | `object`             | No   | 実行計画。詳細は下記。                                                                                              |
| `findings`  | `array`              | No   | レビュー指摘事項の配列。各要素は `output.schema.json` の issue 定義と互換（`$defs/finding` として同一構造を定義）。 |
| `context`   | `object`             | No   | リポジトリと差分のコンテキスト情報。                                                                                |
| `debug`     | `object`             | No   | デバッグ情報。自由形式でバージョン間の構造保証なし。                                                                |

### `plan` オブジェクト

| フィールド       | 型       | 説明                                                                                                                                                |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selectedSkills` | `array`  | 実行対象として選択されたスキルの配列。各要素は `id`（必須）、`name`（必須）、`phase`、`modelHint`（`cheap` / `balanced` / `high-accuracy`）を持つ。 |
| `skippedSkills`  | `array`  | スキップされたスキルの配列。各要素は `id`（必須）と `reasons`（必須、文字列配列）を持つ。                                                           |
| `plannerMode`    | `string` | AI プランナーのモード。`off` / `order` / `prune`。                                                                                                  |
| `plannerReasons` | `array`  | プランナーによるスキルごとの判断理由。各要素は `id`（必須）と `reason`（必須）を持つ。                                                              |
| `impactTags`     | `array`  | 変更の影響領域を示すタグ（例: `security`, `performance`）。                                                                                         |

### `context` オブジェクト

| フィールド         | 型       | 説明                                             |
| ------------------ | -------- | ------------------------------------------------ |
| `repoRoot`         | `string` | リポジトリルートの絶対パス。                     |
| `defaultBranch`    | `string` | デフォルトブランチ名（例: `main`）。             |
| `mergeBase`        | `string` | 差分取得に使用したマージベースのコミット SHA。   |
| `changedFiles`     | `array`  | レビュー対象のファイルパス一覧。                 |
| `tokenEstimate`    | `number` | 最適化後の差分テキストの推定トークン数（>= 0）。 |
| `rawTokenEstimate` | `number` | 最適化前（生差分）の推定トークン数（>= 0）。     |
| `reduction`        | `number` | 差分最適化によるトークン削減率（0-100）。        |

### `status` の値

| 値                 | 意味                                  |
| ------------------ | ------------------------------------- |
| `ok`               | レビューが正常に完了した。            |
| `no-changes`       | 対象差分がなかった。                  |
| `skipped-by-label` | PR ラベルにより実行がスキップされた。 |
| `error`            | エラーが発生した。                    |

## 下流消費者

Review Artifact は以下のシステムで消費されることを想定しています。

### CI（GitHub Actions）

- レビュー結果を構造化データとして取得し、PR コメントの生成やステータスチェックに利用。
- `status` フィールドで早期リターン判定が可能。

### Riverbed Memory

- レビュー結果をリポジトリ固有の学習データとして蓄積。
- `plan` セクションから、どのスキルが有効だったかを記録。
- `findings` から過去の指摘パターンを分析。

### Eval（評価パイプライン）

- `plan` と `findings` を評価フィクスチャと照合し、スキルの精度を測定。
- `context.tokenEstimate` と `context.reduction` で差分最適化の効果を追跡。

## シリアライゼーション

- 形式: **JSON**
- エンコーディング: UTF-8
- ファイル拡張子: `.json`
- MIME タイプ: `application/json`

## 関連ドキュメント

- [Review Output Schema](../../schemas/output.schema.json) -- 個別の指摘事項（issue）の定義
- [Review Artifact Schema](../../schemas/review-artifact.schema.json) -- 本スキーマの JSON Schema ファイル
- [Review Policy](./review-policy.md) -- AI レビュー標準ポリシー
- [Review Output Examples](./review-output-example.md) -- レビュー出力例
- [Riverbed Storage](./riverbed-storage.md) -- Riverbed Memory ストレージ設計
- [Evaluation Fixture Format](./evaluation-fixture-format.md) -- 評価フィクスチャ形式
