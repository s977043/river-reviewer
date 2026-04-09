# スキルスキーマ・リファレンス

River Reviewer のすべてのスキルは、以下の JSON スキーマに準拠する必要があります:

```text
/schemas/skill.schema.json
```

## 必須フィールド

| フィールド  | 説明                                     |
| ----------- | ---------------------------------------- |
| id          | 一意のスキル識別子（rr-xxxx 形式を推奨） |
| name        | 人間が読めるスキル名                     |
| description | スキルが何をチェックするか               |
| phase       | upstream / midstream / downstream        |
| applyTo     | ファイルのグロブパターン                 |

`phase` と `applyTo` はトップレベルまたは `trigger` 内に書けます（`trigger.phase`, `trigger.applyTo` / `trigger.files`）。両方指定した場合はトップレベルが優先されます。

## 例

```yaml
---
id: rr-python-sqlinj-v1
name: Python SQL Injection Check
description: Python コード内の SQL インジェクションパターンを検出する
phase: midstream
applyTo:
  - '**/*.py'
tags: ['security', 'owasp']
---
# 指示...
```

### trigger ラッパーを使用した例

```yaml
---
id: rr-python-sqlinj-v2
name: Python SQL Injection Check
description: Python コード内の SQL インジェクションパターンを検出する
trigger:
  phase: midstream
  files:
    - '**/*.py'
tags: ['security', 'owasp']
---
# 指示...
```

## Loading Stages

スキルのフィールドは、[Progressive Disclosure](../explanation/progressive-disclosure.md) の 3 段階に対応しています。

| Stage | タイミング | フィールド |
|-------|-----------|-----------|
| 1: Metadata | 常時（起動時） | `id`, `name`, `description`, `phase`, `applyTo`, `tags`, `severity`, `inputContext`, `outputKind`, `modelHint`, `dependencies`, `priority` |
| 2: Instructions | スキル選択後 | `body`（Markdown 本文） |
| 3: References | レビュー実行時 | `prompt.system`, `prompt.user`, `fixtures/`, `golden/`, Riverbed Memory entries |

Stage 1 のフィールドはフィルタリングとルーティングに使用され、Stage 2 以降は LLM プロンプトの構築に使用されます。ローダーは Stage 1 のメタデータのみでスキル選択を完了できるように設計されています。
