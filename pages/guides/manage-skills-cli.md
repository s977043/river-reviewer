---
title: スキルを import / export / list する（CLI）
---

River Review は Agent Skills（`SKILL.md` パッケージ）と River Review 形式のスキルを相互変換し、一覧表示する CLI サブコマンドを備えています。`river skills import|export|list` を使うと、外部の Agent Skills を取り込んだり、自分のスキルを Agent Skills 形式で書き出したり、現在認識されているスキルを確認したりできます。

> スキル定義のフォーマットそのものについては [Manifest-driven Skills ガイド](./agent-skills-codex-cli.md)、検証手順は [スキルスキーマを検証する](./validate-skill-schema.md) を参照してください。本ページは CLI での import / export / list の使い方に絞っています。

## 1. スキル一覧を確認する（`skills list`）

現在 River Review が認識しているスキルを一覧表示します。

```bash
river skills list
```

`ID` / `NAME` / `SOURCE` / `PATH` の表が出力されます。`SOURCE` は次の 2 種類です。

- `rr` — River Review 形式のスキル（`skills/` 配下）
- `agent` — Agent Skills 形式のパッケージ（`.agents/skills` / `.github/skills` / `.claude/skills` 配下の `SKILL.md`）

すでに River Review 形式として読み込まれている（import 済みの）Agent Skill は重複排除され、`rr` としてのみ表示されます。

### ソースで絞り込む（`--source`）

```bash
river skills list --source rr      # River Review 形式のみ
river skills list --source agent   # Agent Skills 形式のみ
river skills list --source all     # 両方（既定）
```

## 2. Agent Skills を取り込む（`skills import`）

外部の `SKILL.md` パッケージを River Review 形式に変換して取り込みます。

```bash
river skills import
```

`--from` を指定しない場合、次のディレクトリを既定で走査します。

- `.agents/skills`
- `.github/skills`
- `.claude/skills`

変換結果は既定で `skills/agent-skills/` に書き出されます。

### 取り込み元・出力先を指定する（`--from` / `--to`）

```bash
river skills import --from ./vendor/skills --to ./skills/imported
```

- `--from <path>` — `SKILL.md` を探索するソースディレクトリ
- `--to <path>` — 変換後スキルの出力ディレクトリ

### 検証モード（`--strict` / `--loose`）

- `--strict`（既定）— River Review スキーマへの完全準拠を要求する。必須フィールドが欠けていれば失敗として報告される。
- `--loose` — `name` / `description` など最小限のフィールドのみを要求し、欠落フィールドは自動補完する。手元で試したい外部スキルを素早く取り込みたいときに使う。

### 書き込まずに検証する（`--dry-run`）

```bash
river skills import --from ./vendor/skills --dry-run
```

ファイルを書き出さずに変換・検証だけを行います。取り込み前の事前チェックに使います。

`import` 完了時には「imported / failed / warnings」の件数が出力されます。`failed` が 1 件以上ある場合、終了コードは `1` になります。

## 3. スキルを Agent Skills 形式で書き出す（`skills export`）

River Review 形式のスキル（`skills/` 配下）を Agent Skills の `SKILL.md` 形式に変換して書き出します。

```bash
river skills export
```

既定の出力先は `.agents/skills` です。`--to` で変更できます。

```bash
river skills export --to ./dist/agent-skills
```

### 付随アセットも含める（`--include-assets`）

```bash
river skills export --include-assets
```

`references/` / `scripts/` / `prompt/` ディレクトリを `SKILL.md` と並べてコピーします。スキル本体だけでなく、参照ファイルやスクリプトもまとめて配布したいときに指定します。

`export` 完了時には「exported / failed」の件数が出力されます。`failed` が 1 件以上ある場合、終了コードは `1` になります。

## オプション早見表

| サブコマンド | オプション         | 説明                                                                  |
| ------------ | ------------------ | --------------------------------------------------------------------- |
| `import`     | `--from <path>`    | `SKILL.md` を探索するソースディレクトリ（既定: 標準探索ディレクトリ） |
| `import`     | `--to <path>`      | 変換後スキルの出力ディレクトリ（既定: `skills/agent-skills/`）        |
| `import`     | `--strict`         | River Review スキーマへの完全準拠を要求（既定）                       |
| `import`     | `--loose`          | 最小限のフィールドのみ要求し欠落を自動補完                            |
| `import`     | `--dry-run`        | ファイルを書き出さずに検証のみ実行                                    |
| `export`     | `--to <path>`      | `SKILL.md` の出力ディレクトリ（既定: `.agents/skills`）               |
| `export`     | `--include-assets` | `references/` `scripts/` `prompt/` も併せてコピー                     |
| `list`       | `--source <type>`  | フィルタ: `rr` / `agent` / `all`（既定: `all`）                       |

## 関連ページ

- [Manifest-driven Skills ガイド](./agent-skills-codex-cli.md) — スキル定義フォーマット（Markdown / YAML）
- [スキルを追加する（最短手順）](./add-new-skill.md)
- [スキルスキーマを検証する](./validate-skill-schema.md)
