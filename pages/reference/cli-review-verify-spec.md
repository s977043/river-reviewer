---
title: CLI Spec — `river review verify`
---

`river review verify` は、既に生成されたレビュー結果（`review-self` / `review-external`）と元の上流アーティファクト（`plan` / `diff` / `test-cases` など）を入力として受け取る CLI コマンドです。verify 系 skill を走らせて **W チェック（レビューの再監査）** を行い、既存レビューの抜け・誤検知・ハルシネーションを再点検し、META finding（レビューに対するレビュー）を [Review Artifact](./review-artifact.md) として出力します。本ドキュメントはコマンドの引数・入力・出力・終了コードを spec として固定し、CI から安定して呼び出せる契約を定義します。

> 関連 Issue: #575（Task）/ #509（Capability）/ #507（Epic）
> 関連 spec: `river review plan`（#517）/ `river review exec`（#518）/ `rr-upstream-plangate-verification-audit-001`（skill spec は #577 で作成予定）

## 責務分担（plan / exec / verify の関係）

| コマンド              | 主目的                                                                                                                                              | 副作用                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `river review plan`   | 入力 artifact から実行計画（選択 skill / プランナー判断）のみを算出する。LLM 推論は最小限。                                                         | レビュー skill は走らせない。                 |
| `river review exec`   | `plan` の結果（または同等の解決処理）を受け、レビュー skill を実行して `findings` を生成する。                                                      | 外部 LLM 呼び出し・Review Artifact 書き出し。 |
| `river review verify` | 既存レビュー結果と上流 artifact を入力とし、verify 系 skill のみを実行して既存 findings を再点検する（W チェック）。non-verify skill は実行しない。 | 外部 LLM 呼び出し・META finding の書き出し。  |

`verify` は `plan` を **内部的に呼び出してもよい** が、選択対象は verify 系 skill のみに制限され、非 verify skill は `plan.skippedSkills` に `not-verify-skill` 理由で記録されます。`exec` と `verify` は対象スコープが異なるため、`verify` から非 verify skill を再実行することは契約として禁止します。

## Usage

```bash
river review verify [options]
```

### 代表例

```bash
# 1) 既存の review-self / review-external を W チェックする
river review verify \
  --artifact review-self=./artifacts/review-self.md \
  --artifact review-external=./artifacts/review-external.md \
  --artifact plan=./artifacts/plan.md \
  --artifact diff=./artifacts/diff.patch \
  --output ./artifacts/review-audit-artifact.json

# 2) plan を別工程で算出し verify 側で再生する
river review plan --phase upstream --output ./artifacts/plan.json
river review verify --plan ./artifacts/plan.json \
  --artifact review-external=./artifacts/review-external.md

# 3) コスト見積もりのみ
river review verify --estimate \
  --artifact review-self=./artifacts/review-self.md

# 4) advisory モードで CI を落とさず監査のみ実施
river review verify --advisory-only \
  --artifact review-external=./artifacts/review-external.md
```

## 引数とオプション

### 入力選択

| オプション             | 型         | 既定値     | 説明                                                                                                                          |
| ---------------------- | ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--artifact <id=path>` | 繰り返し可 | （未指定） | [Artifact Input Contract](./artifact-input-contract.md) の ID を明示して入力ファイルを指定する。`id` は contract の表に従う。 |
| `--config <path>`      | string     | 自動検出   | `river.config.*` を明示する。設定内 `artifacts` セクションで一括解決可。                                                      |
| `--plan <path>`        | string     | （未指定） | 既存の plan JSON を入力として再生する。指定時は内部での plan 算出をスキップする（verify 系 skill のみに絞られる契約は維持）。 |
| `--target <path>`      | string     | `.`        | リポジトリルート。`pwd` と異なる場合に指定する。                                                                              |

`--artifact` / `--config` / カレントディレクトリ検出の優先順位は contract に従います（CLI > config > 検出）。`review-self` および `review-external` の少なくとも一方が解決できない場合、`verify` は後述「失敗条件」に従い Exit `1` で中断します。

### フェーズ / プランナー

| オプション          | 型                                        | 既定値     | 説明                                                                                |
| ------------------- | ----------------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| `--phase <value>`   | `upstream` \| `midstream` \| `downstream` | `upstream` | レビュー対象の SDLC フェーズ。W チェックは基本的に上流監査のため既定は `upstream`。 |
| `--planner <value>` | `off` \| `order` \| `prune`               | `off`      | プランナーモード。`--plan` を渡した場合はこのオプションは無視される。               |

### 実行制御

| オプション         | 型     | 既定値  | 説明                                                                                                                                                                |
| ------------------ | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`        | bool   | `false` | 外部 LLM API を呼ばず、入力解決と plan のみを実行する。`status` は `ok` または `no-review-input`。                                                                  |
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

### 失敗判定の閾値

| オプション             | 型   | 既定値     | 説明                                                                                                       |
| ---------------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `--fail-on <severity>` | enum | `critical` | `critical` / `major` / `minor` / `info`。指定 severity 以上の META finding が 1 件でもあれば fail と判定。 |
| `--warn-on <severity>` | enum | `major`    | `--fail-on` には届かないが warn と扱う閾値。                                                               |
| `--advisory-only`      | flag | false      | severity に関わらず常に成功扱い（exit `0`）。発見事項は出力されるが CI を落とさない。                      |

severity の語彙と内部語彙の対応は [`.claude/rules/review-core.md`](../../.claude/rules/review-core.md) および [`schemas/output.schema.json`](../../schemas/output.schema.json) に準ずる。不明な severity 値は fail-safe として `major` に分類される。

## Skill 選択（verify ファミリー制限）

`verify` は実行対象を **verify 系 skill** に限定します。判定は次のいずれかを満たす skill を verify 系と見なすヒューリスティクスです。

- `id` が `rr-upstream-plangate-verification-` で始まる（代表: `rr-upstream-plangate-verification-audit-001`、spec は #577 で作成予定）。
- skill メタデータの `outputKind` に `review-audit` が含まれる。

非 verify skill は `plan.selectedSkills` には含めず、`plan.skippedSkills` に `reason: "not-verify-skill"` として記録します。Review Artifact を読む CI や Riverbed Memory 側で、`verify` 経由のレビュー監査であることを明示的に判別できるようにするためです。

## 入力アーティファクト

`river review verify` は [Artifact Input Contract](./artifact-input-contract.md) の解決結果を消費します。`verify` スコープで特に重要なのは既存レビュー結果と、そのレビューが依拠した上流 artifact の対応付けです。

| Artifact ID                       | 使用観点                                                        | 欠損時挙動                                                                                                                                                |
| --------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `review-self`                     | セルフレビュー結果。W チェックの主要対象。                      | `review-external` も解決できない場合、`status: no-review-input` + Exit `1`。                                                                              |
| `review-external`                 | 外部（AI/人間）レビュー結果。W チェックの主要対象。             | `review-self` も解決できない場合、`status: no-review-input` + Exit `1`。                                                                                  |
| `plan`                            | 上流の実行計画。レビューが前提とした設計意図の参照元。          | 任意。欠損時は該当観点 skill を `plan.skippedSkills` に記録しスキップ。                                                                                   |
| `diff`                            | レビュー対象差分。ハルシネーション検知に必要。                  | 未指定なら `git diff <mergeBase>..HEAD` で取得。空なら W チェックの意味が薄いが `no-changes` ではなく `ok` とし verify を継続（レビュー監査自体は可能）。 |
| `test-cases`                      | テスト観点と既存レビューの整合性検証に使用。                    | 任意。欠損時は該当観点 skill を `plan.skippedSkills` に記録しスキップ。                                                                                   |
| `pbi-input` / `todo` / `junit` 等 | 文脈補強に使用（contract の「対象アーティファクト一覧」参照）。 | 任意。欠損時は contract に従う。                                                                                                                          |

- `review-self` / `review-external` は **少なくとも一方が必須** である。両方とも解決できない場合は「失敗条件」の最初のケースに該当する。
- 各 artifact の必須/任意・形式・サイズ目安は [Artifact Input Contract](./artifact-input-contract.md) を SSoT とし、本 spec では再掲しない。
- 解決した artifact 一覧は Review Artifact の `context` / `debug` に記録される。

## 出力（Review Artifact）

`river review verify` の出力は [Review Artifact スキーマ](./review-artifact.md)（`schemas/review-artifact.schema.json`、version `"1"`）に従う JSON です。`verify` が責任を持って埋めるフィールドの最小セットは次の通りです。

- `version`: 常に `"1"`。
- `timestamp`: 実行完了時の ISO 8601。
- `phase`: `--phase` の値（既定 `upstream`）。
- `status`: 後述の「終了ステータス」表に従う。`no-review-input` を含む。
- `plan`: 採用した実行計画。`selectedSkills` は verify 系のみ、`skippedSkills` に `not-verify-skill` 等の理由を記録。
- `findings`: verify 系 skill が生成した **META finding** の配列。対象は既存 `review-self` / `review-external` の指摘品質（抜け・誤検知・ハルシネーション・根拠欠落など）であり、元コードへの直接指摘ではない点に留意する。各要素は `output.schema.json` の `issue` と互換。
- `context`: `repoRoot` / `defaultBranch` / `mergeBase` / `changedFiles` / `tokenEstimate` / `rawTokenEstimate` / `reduction` を埋める（取得不能なフィールドは省略）。
- `debug`: `--debug` 時または `--estimate` 時に詳細を格納する自由形式オブジェクト。

`status` と CLI 終了コードの対応は次節の通りです。

## 終了コード

CI から安定して判定できるよう、終了コードを以下の通り固定します。`exec` と同じ 3 値（`0` / `1` / `2`）の shape を採用します。

| Exit | 用途                              | 代表的な状況                                                                                                                     |
| ---- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `0`  | 成功                              | `status` が `ok` / `skipped-by-label` のいずれかで、`--max-cost` 超過もない。                                                    |
| `1`  | 失敗（ユーザー入力 / ランタイム） | `review-self` / `review-external` が両方とも解決不能（`no-review-input`）、必須 artifact 解決失敗、`--max-cost` 超過、内部例外。 |
| `2`  | 設定エラー                        | `--config` の読み込み失敗、未知の `--artifact id`、未知の `--phase` / `--planner` 値。                                           |

`findings` の severity は既定では終了コードに直接影響しません。`--fail-on` / `--warn-on` を指定した場合は [`river review plan`](./cli-review-plan-spec.md) と同じ閾値判定ロジックで fail / warn / advisory を決定します（`--advisory-only` 指定時は常に `0`）。

> 備考: [Stable Interfaces](./stable-interfaces.md) の最小 CLI 契約では終了コードを `0` / `1` の 2 値に絞っています。本 spec の `2`（設定エラー）は `verify` サブコマンド固有の拡張であり、CI で `2` を未知扱いとした場合も `!= 0` として失敗扱いになるため後方互換を壊しません。

### `status` と終了コードの対応

| `status`           | Exit | 意味                                                                                                 |
| ------------------ | ---- | ---------------------------------------------------------------------------------------------------- |
| `ok`               | `0`  | 全 verify skill 実行が正常完了した（META `findings` が空でも `ok`）。                                |
| `skipped-by-label` | `0`  | PR ラベル等の運用ルールにより verify を意図的にスキップした。                                        |
| `no-review-input`  | `1`  | `review-self` / `review-external` のいずれも解決できず、W チェック対象が存在しない（誤用と見なす）。 |
| `error`            | `1`  | 実行時エラー。詳細は `debug` および stderr。                                                         |

`verify` は `exec` と異なり **`no-changes` を `0` とは扱いません**。差分が空でも既存レビュー自体の監査は意味があるため、`status` は `ok` のままとします。一方で、レビュー入力そのものが無い `no-review-input` は誤用として Exit `1` にマップします。

## 失敗条件（fail conditions）

`verify` は次の条件で `status: error`（または `status: no-review-input`）+ Exit `1` を返します。

- `review-self` / `review-external` のいずれも解決できない（`status: no-review-input`）。stderr に次のメッセージを出力する: `rr-cli-verify: review-self / review-external のいずれも解決できませんでした`。
- `--artifact` で指定されたパスが存在しない、または読み込めない。
- `--plan` で指定された JSON がスキーマ違反である。
- verify skill 実行中に未捕捉例外が発生し、リトライ可能でない。
- `--max-cost` を超える見積もりとなった（`--estimate` との併用時は skill を実行しないため中断条件の対象外。`status: ok` + exit `0` を返す）。

`--config` / `--artifact` / `--phase` / `--planner` の **構文エラー**（未知の値・不正なフォーマット）は Exit `2` とします。

## フォールバック動作

- **`review-self` / `review-external` のいずれか一方のみ解決**: 解決できた方のみを対象として W チェックを継続する（Exit `0` の対象）。
- **`plan` / `test-cases` 未指定**: 該当観点 skill を `plan.skippedSkills` に記録しスキップ。Exit には影響しない。
- **`diff` 未指定**: contract に従い `git diff <mergeBase>..HEAD` を内部実行する。`mergeBase` は `context.defaultBranch` から推定する。
- **`--plan` 未指定**: `verify` 内部で `plan` 相当処理を実行し、verify 系 skill のみを選択対象とする（`--planner` の値を尊重する）。
- **LLM 呼び出し失敗**: skill 単位にリトライする。リトライ後も失敗した skill は `plan.skippedSkills` に理由付きで記録し、`findings` に reporter 由来の `info` レベル通知を残す。**少なくとも 1 つの verify skill が正常完了**し、かつパイプラインが継続可能であれば `status: ok` + exit `0` とする（部分的成功を許容）。すべての verify skill が失敗、または回復不能な内部例外が発生した場合のみ `status: error` + exit `1` とする。
- **非 verify skill が plan 候補に混入した場合**: `plan.skippedSkills` へ `reason: "not-verify-skill"` で記録し、実行はしない。Exit への影響はない。

## 安定性と互換性

- 安定性ラベルは **Beta**（参考: [Stable Interfaces](./stable-interfaces.md)）。
- フラグ追加は minor、フラグの削除・意味変更・既定値変更・終了コード意味変更・`status` 値の意味変更は **major** bump とする。
- JSON 出力スキーマの破壊的変更は [Review Artifact](./review-artifact.md) のバージョニングに従う。

## 関連ドキュメント

- [CLI Spec — `river review plan`](./cli-review-plan-spec.md) — 計画専用コマンドの仕様
- [CLI Spec — `river review exec`](./cli-review-exec-spec.md) — レビュー実行コマンドの仕様
- [Artifact Input Contract](./artifact-input-contract.md) — 入力アーティファクトの SSoT
- [Review Artifact](./review-artifact.md) — 出力スキーマ
- [Stable Interfaces](./stable-interfaces.md) — CLI / GitHub Actions の安定契約
- [Review Policy](./review-policy.md) — AI レビュー標準ポリシー
