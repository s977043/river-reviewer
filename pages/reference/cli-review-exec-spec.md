---
title: CLI Spec — `river review exec`
---

`river review exec` は、解決済みの入力アーティファクト（差分・テスト結果・lint / typecheck など）を受け取り、レビュー skill 群を実際に走らせて [Review Artifact](./review-artifact.md) を出力する CLI コマンドです。本ドキュメントはコマンドの引数・入力・出力・終了コードを spec として固定し、CI から安定して呼び出せる契約を定義します。

> 関連 Issue: #518（Task）/ #509（Capability）/ #507（Epic）
> 関連 spec: `river review plan`（並列 Issue #517 で別途作成）

## 責務分担（plan との関係）

| コマンド            | 主目的                                                                                         | 副作用                                        |
| ------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `river review plan` | 入力 artifact から実行計画（選択 skill / プランナー判断）のみを算出する。LLM 推論は最小限。    | レビュー skill は走らせない。                 |
| `river review exec` | `plan` の結果（または同等の解決処理）を受け、レビュー skill を実行して `findings` を生成する。 | 外部 LLM 呼び出し・Review Artifact 書き出し。 |

`exec` は `plan` を **内部的に呼び出してもよい** が、`--plan <path>` で外部から計画を渡された場合はそれを採用し、自分では計画を立て直さないことを契約とします。これにより plan の決定論性と exec の再現性を両立させます。

## Usage

```bash
river review exec [options]
```

### 代表例

```bash
# 1) 既定の検出（カレントディレクトリ + git）で実行する
river review exec

# 2) 入力 artifact を明示してCI から呼び出す
river review exec \
  --artifact diff=./artifacts/diff.patch \
  --artifact junit=./artifacts/junit.xml \
  --artifact lint=./artifacts/lint.json \
  --artifact typecheck=./artifacts/typecheck.txt \
  --output ./artifacts/review-artifact.json

# 3) plan を別工程で算出し、それを再生する
river review plan --output ./artifacts/plan.json
river review exec --plan ./artifacts/plan.json --output ./artifacts/review-artifact.json

# 4) コスト見積もり超過時は実行しない
river review exec --max-cost 0.50
```

## 引数とオプション

### 入力選択

| オプション             | 型         | 既定値     | 説明                                                                                                                          |
| ---------------------- | ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--artifact <id=path>` | 繰り返し可 | （未指定） | [Artifact Input Contract](./artifact-input-contract.md) の ID を明示して入力ファイルを指定する。`id` は contract の表に従う。 |
| `--config <path>`      | string     | 自動検出   | `river.config.*` を明示する。設定内 `artifacts` セクションで一括解決可。                                                      |
| `--plan <path>`        | string     | （未指定） | 既存の plan JSON を入力として再生する。指定時は内部での plan 算出をスキップする。                                             |
| `--target <path>`      | string     | `.`        | リポジトリルート。`pwd` と異なる場合に指定する。                                                                              |

`--artifact` / `--config` / カレントディレクトリ検出の優先順位は contract に従います（CLI > config > 検出）。

### フェーズ / プランナー

| オプション          | 型                                        | 既定値      | 説明                                                                    |
| ------------------- | ----------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| `--phase <value>`   | `upstream` \| `midstream` \| `downstream` | `midstream` | レビュー対象の SDLC フェーズ。Review Artifact の `phase` に転写される。 |
| `--planner <value>` | `off` \| `order` \| `prune`               | `off`       | プランナーモード。`--plan` を渡した場合はこのオプションは無視される。   |

### 実行制御

| オプション         | 型     | 既定値  | 説明                                                                                                                                                                |
| ------------------ | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`        | bool   | `false` | 外部 LLM API を呼ばず、入力解決と plan のみを実行する。`status` は `ok` または `no-changes`。                                                                       |
| `--estimate`       | bool   | `false` | コスト見積もりのみを行う。skill 実行は行わず、見積結果を Review Artifact の `debug` に格納し `status` は `ok` とする。                                              |
| `--max-cost <usd>` | number | （無）  | 見積もりが上限を超えた場合に skill 実行を中断する（exit `1`）。`--estimate` と併用した場合は見積結果のみを出力し中断せず exit `0`（skill 実行は元々行わないため）。 |
| `--debug`          | bool   | `false` | 詳細ログを stderr に出す。Review Artifact の `debug` も拡充される。                                                                                                 |

### 出力

| オプション         | 型                   | 既定値                             | 説明                                                                       |
| ------------------ | -------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| `--output <path>`  | string               | `./artifacts/review-artifact.json` | Review Artifact JSON の書き出し先。`-` 指定時は stdout に書き出す。        |
| `--format <value>` | `json` \| `markdown` | `json`                             | `--output` に書き出す形式。`markdown` は CI コメント用の整形版を出力する。 |
| `--no-write`       | bool                 | `false`                            | 標準出力にのみ書き出し、ファイルを生成しない。                             |

`--output` と `--format` の組み合わせは [Review Artifact](./review-artifact.md) スキーマ（JSON）と既存 Action の Markdown 出力契約（[Stable Interfaces](./stable-interfaces.md)）に準じます。

> 備考: [Stable Interfaces](./stable-interfaces.md) の最小 CLI リファレンスでは `--output <text|markdown>` が出力形式を表しますが、`river review exec` サブコマンドでは **出力先ファイルパス** を `--output`、**出力形式** を `--format` に分離します。これは artifact 書き出しを伴う `exec` 固有の拡張であり、既存 `river run` のオプション意味論は変更しません。

## 入力アーティファクト

`river review exec` は [Artifact Input Contract](./artifact-input-contract.md) の解決結果を消費します。`exec` スコープでは特に以下を使用します。

| Artifact ID                                                                      | 使用観点                                  | 欠損時挙動                                                            |
| -------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `diff`                                                                           | レビュー対象差分。すべての skill の前提。 | 未指定なら `git diff <mergeBase>..HEAD` で取得。空なら `no-changes`。 |
| `junit`                                                                          | テスト失敗観点 skill の入力。             | 該当 skill をスキップし `plan.skippedSkills` に記録。                 |
| `coverage`                                                                       | カバレッジ観点 skill の入力。             | 同上。                                                                |
| `lint`                                                                           | 静的解析（lint）観点 skill の入力。       | 同上。                                                                |
| `typecheck`                                                                      | 型検査観点 skill の入力。                 | 同上。                                                                |
| `pbi-input` / `plan` / `todo` / `test-cases` / `review-self` / `review-external` | 上流文脈系 skill の入力。                 | 同上（contract に従う）。                                             |

- 各 artifact の必須/任意・形式・サイズ目安は [Artifact Input Contract](./artifact-input-contract.md) を SSoT とし、本 spec では再掲しない。
- 解決した artifact 一覧は Review Artifact の `context` / `debug` に記録される。

## 出力（Review Artifact）

`river review exec` の出力は [Review Artifact スキーマ](./review-artifact.md)（`schemas/review-artifact.schema.json`、version `1`）に従う JSON です。`exec` が責任を持って埋めるフィールドの最小セットは次の通りです。

- `version`: 常に `"1"`。
- `timestamp`: 実行完了時の ISO 8601。
- `phase`: `--phase` の値。
- `status`: 後述の「終了ステータス」表に従う。
- `plan`: 採用した実行計画（`--plan` を渡した場合はその内容、無ければ内部算出結果）。
- `findings`: 実行された skill の指摘事項配列。`output.schema.json` の `issue` と互換。
- `context`: `repoRoot` / `defaultBranch` / `mergeBase` / `changedFiles` / `tokenEstimate` / `rawTokenEstimate` / `reduction` を埋める（取得不能なフィールドは省略）。
- `debug`: `--debug` 時または `--estimate` 時に詳細を格納する自由形式オブジェクト。

`status` と CLI 終了コードの対応は次節の通りです。

## 終了コード

CI から安定して判定できるよう、終了コードを以下の通り固定します。

| Exit | 用途                              | 代表的な状況                                                                                 |
| ---- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| `0`  | 成功                              | `status` が `ok` / `no-changes` / `skipped-by-label` のいずれかで、`--max-cost` 超過もない。 |
| `1`  | 失敗（ユーザー入力 / ランタイム） | 入力不正、必須 artifact 解決失敗、`git diff` 失敗、`--max-cost` 超過、内部例外。             |
| `2`  | 設定エラー                        | `--config` の読み込み失敗、未知の `--artifact id`、未知の `--phase` / `--planner` 値。       |

`findings` の severity（`critical` / `major` / `minor` / `info`）は終了コードに直接は影響しません。CI 側で Review Artifact の `findings` を読んでゲート判定する運用を推奨します（[Stable Interfaces](./stable-interfaces.md) に準拠）。

> 備考: [Stable Interfaces](./stable-interfaces.md) の最小 CLI 契約では終了コードを `0` / `1` の 2 値に絞っています。本 spec の `2`（設定エラー）は `exec` サブコマンド固有の拡張であり、CI で `2` を未知扱いとした場合も `!= 0` として失敗扱いになるため後方互換を壊しません。

### `status` と終了コードの対応

| `status`           | Exit | 意味                                                        |
| ------------------ | ---- | ----------------------------------------------------------- |
| `ok`               | `0`  | 全 skill 実行が正常完了した（`findings` が空でも `ok`）。   |
| `no-changes`       | `0`  | 解決した差分が空。skill は実行されない。                    |
| `skipped-by-label` | `0`  | PR ラベル等の運用ルールにより exec を意図的にスキップした。 |
| `error`            | `1`  | 実行時エラー。詳細は `debug` および stderr。                |

## 失敗条件（fail conditions）

`exec` は次の条件で `status: error` + Exit `1` を返します。

- `--artifact` で指定されたパスが存在しない、または読み込めない。
- 必須 artifact（`diff` または fallback の `git diff`）が解決できない。
- `--plan` で指定された JSON がスキーマ違反である。
- skill 実行中に未捕捉例外が発生し、リトライ可能でない。
- `--max-cost` を超える見積もりとなった（`--estimate` との併用時は skill を実行しないため中断条件の対象外。`status: ok` + exit `0` を返す）。

`--config` / `--artifact` / `--phase` / `--planner` の **構文エラー**（未知の値・不正なフォーマット）は Exit `2` とします。

## フォールバック動作

- **`diff` 未指定**: contract に従い `git diff <mergeBase>..HEAD` を内部実行する。`mergeBase` は `context.defaultBranch` から推定する。
- **任意 artifact 欠損**: 該当観点 skill を `plan.skippedSkills` に記録してスキップする。Exit には影響しない。
- **`--plan` 未指定**: `exec` 内部で `plan` 相当処理を実行する（`--planner` の値を尊重する）。
- **LLM 呼び出し失敗**: skill 単位にリトライする。リトライ後も失敗した skill は `plan.skippedSkills` に理由付きで記録し、`findings` に reporter 由来の `info` レベル通知を残す。**少なくとも 1 つの skill が正常完了**し、かつ exec 全体のパイプラインが継続可能であれば `status: ok` + exit `0` とする（部分的成功を許容）。すべての skill が失敗、または回復不能な内部例外が発生した場合のみ `status: error` + exit `1` とする。CI 側で部分失敗を検知したい場合は Review Artifact の `plan.skippedSkills` と `findings` を参照すること。

## 関連ドキュメント

- [Artifact Input Contract](./artifact-input-contract.md) — 入力アーティファクトの SSoT
- [Review Artifact](./review-artifact.md) — 出力スキーマ
- [Stable Interfaces](./stable-interfaces.md) — CLI / GitHub Actions の安定契約
- [Runner CLI Reference](./runner-cli-reference.md) — Runner CLI の使い方
- [Review Policy](./review-policy.md) — AI レビュー標準ポリシー
