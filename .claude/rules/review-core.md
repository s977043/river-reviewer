---
description: River Reviewerのレビュー基準（ローカルレビュー時に自動適用）
globs:
  - '**/*'
---

# レビュー基準

詳細な基準は以下のSSoTを参照すること:

- 重要度ラベルと出力形式: `docs/review/output-format.md`
- レビュー観点: `docs/review/viewpoints.md`
- レビューポリシー全体: `pages/reference/review-policy.md`

## Severityの語彙マッピング

内部語彙（LLMプロンプト）とJSON出力スキーマの対応:

| 内部語彙 | 出力スキーマ |
| -------- | ------------ |
| blocker  | critical     |
| warning  | major        |
| nit      | minor        |
| (なし)   | info         |

不明な値はfail-safeとして`major`に分類される。

## このルール固有の追加指示

- 差分に存在しないコードへの推測に基づく指摘は禁止
- 一般論だけのレビュー（具体的な差分への言及なし）は禁止
- PRの目的と無関係な指摘は禁止
- 批判的・攻撃的な口調は禁止
