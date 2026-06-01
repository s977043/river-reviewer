# W チェック（二重レビュー）ガイド

## 概要

**W チェック**（Wチェック / double review）とは、他の AI レビュアーや人間レビュアーが生成した既存のレビュー結果を River Reviewer に渡して再点検する機能です。River Reviewer は渡されたレビュー結果と PR 差分を照合し、指摘の実在性を検証・統合した上でマージ判断を出力します。

典型的なユースケース:

- Claude Code のレビューと Codex のレビューを統合して、各レビュアーの見落としを補完したい
- 人間レビュアーの指摘と AI レビューを照合し、ハルシネーション（架空コード参照）を除去したい
- 複数の AI ツールを並列実行した結果を一元的にトリアージしたい

## アーティファクトの仕様

W チェックは `review-self` と `review-external` の 2 種類のアーティファクトを入力として受け取ります。

| 項目         | `review-self`                                     | `review-external`                                        |
| ------------ | ------------------------------------------------- | -------------------------------------------------------- |
| 役割         | 実装者自身のセルフレビュー                        | 外部 AI / 人間レビュアーの出力                           |
| フォーマット | UTF-8 Markdown フリーフォーム（特定スキーマ不要） | UTF-8 Markdown フリーフォーム（特定スキーマ不要）        |
| 必須 / 任意  | 任意                                              | 任意                                                     |
| 欠損時の挙動 | W チェック系 skill がその入力をスキップ           | W チェック系 skill がその入力をスキップ                  |
| 内部での扱い | provenance: `self-review` として区別              | provenance: `ai-review` または `human-review` として区別 |

両アーティファクトとも任意です。どちらか一方だけでも W チェックは動作しますが（degraded mode）、両方揃っている場合により精度の高い統合が可能です。

詳細は [`pages/reference/artifact-input-contract.md`](../reference/artifact-input-contract.md) の `review-self` / `review-external` 節を参照してください。

## CLI での実行方法

### パターン 1: ファイルを 1 つずつ指定

```bash
river review exec \
  --artifact review-self=./self-review.md \
  --artifact review-external=./codex-review.md \
  --phase midstream
```

### パターン 2: `--ensemble` でディレクトリ一括指定

複数のレビュー結果ファイルをディレクトリにまとめて一括で渡す方法です。`--ensemble` は指定ディレクトリ内の `*.md` ファイルをファイル名のアルファベット順にすべて結合し、`review-external` アーティファクトとして扱います。

```bash
mkdir -p .river/reviews
# .river/reviews/ に各レビュー結果の .md を置く
# 例: .river/reviews/codex.md, .river/reviews/gemini.md, .river/reviews/human.md
river review exec \
  --ensemble .river/reviews/ \
  --phase midstream
```

`--artifact review-external` と `--ensemble` を同時に指定した場合は `--ensemble` が優先されます。

## GitHub Actions での設定方法

現時点では GitHub Actions の `inputs` に `review-self` / `review-external` の入力は未実装です（別途対応予定）。回避策として、`dist/index.mjs` を直接呼び出すことで同等の動作が可能です。

```yaml
- name: Collect external reviews
  run: |
    mkdir -p .river/reviews
    echo "$CODEX_REVIEW" > .river/reviews/codex.md
    echo "$HUMAN_REVIEW" > .river/reviews/human.md
  env:
    CODEX_REVIEW: ${{ vars.CODEX_REVIEW_OUTPUT }}
    HUMAN_REVIEW: ${{ vars.HUMAN_REVIEW_OUTPUT }}

- name: Run W-check
  run: |
    node ${{ github.action_path }}/dist/index.mjs run . \
      --phase midstream \
      --ensemble .river/reviews/
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

> **注意**: `github.action_path` の参照は例示です。実際の Action を参照しているワークフロー内の Action パス（例: `$GITHUB_WORKSPACE/runners/github-action`）に合わせて調整してください。

## synthesis skill の動作

W チェックの統合処理は `rr-midstream-independent-review-synthesis-001` skill（`recommended: true`）が担います。この skill は以下の 3 つの主要ステップで動作します。

1. **重複排除 (Deduplicate)**: 複数のレビュアーが同じ箇所を指摘した場合、file path・行範囲・evidence テキストに基づいて同一 finding として統合する。
2. **ハルシネーション検証 (Hallucination guard)**: 各 finding の `evidence` が参照するファイルパスとコードスニペットを実際の差分と照合し、実在しないコードを参照している指摘を `dismissed-hallucination` として除外する。
3. **マージ推奨 (Merge recommendation)**: 確認済みの critical / major finding の有無に基づいて `merge-ready` / `human-review` / `block` のいずれかを出力する。

skill の詳細: [`skills/midstream/community/rr-midstream-independent-review-synthesis-001/SKILL.md`](https://github.com/s977043/river-reviewer/blob/main/skills/midstream/community/rr-midstream-independent-review-synthesis-001/SKILL.md)

## 関連ページ

- [Artifact Input Contract](../reference/artifact-input-contract.md) — `review-self` / `review-external` の仕様詳細
- [Independent Review Synthesis skill](https://github.com/s977043/river-reviewer/blob/main/skills/midstream/community/rr-midstream-independent-review-synthesis-001/SKILL.md) — synthesis skill の全ルール
- [GitHub Actions セットアップ](./github-actions.md) — 基本的な GitHub Actions 構成
