---
id: embedding-code-index-research
---

# Embedding-based code index の検討（research note）

> Status: **Research / Decision pending → 実装は当面見送り、`heuristic + ripgrep` の限界が明示された段階で再検討**
>
> 関連: [#691 research(context): embedding-based code indexを検討する](https://github.com/s977043/river-reviewer/issues/691) / 親 Epic [#650](https://github.com/s977043/river-reviewer/issues/650)

このノートは、River Reviewer の repo-wide review に embedding-based code index を導入する価値があるかを判断するための調査記録です。Issue #691 の Acceptance Criteria に対する回答を 1 ファイルにまとめます。

## 1. なぜ検討するか（解こうとしている問題）

現在の context collector（[`src/lib/repo-context.mjs`](https://github.com/s977043/river-reviewer/blob/main/src/lib/repo-context.mjs)）は、変更ファイル → path heuristic + symbol grep + sibling 探索でコンテキストを集めます。これで十分なケースが多い一方、リポジトリが大きくなると次の限界が出る可能性があります。

- 同じ概念が異なる命名で実装されているとき（例: `formatUserId` と `normaliseAccountIdentifier`）、文字列検索では辿りにくい
- ADR / 仕様書（自然文）と実装の意味的関連を拾えない
- cross-file な設計パターン（例: Repository 抽象が複数ファイルに散らばる）を抽出しにくい
- 大規模 monorepo で symbol grep 結果が多すぎ、ranking ができない

これを「semantic retrieval」（意味的近傍検索）で補えるか、というのが本検討の出発点です。

## 2. ripgrep / heuristic で十分な範囲

判断のため、現行アプローチの **強み** と **限界** を分けて整理しました。

### 十分なケース

- 変更ファイルと **同名 / 近似名** のテストファイルや locale ファイル
- export された symbol の **直接利用箇所**（`rg` で 1 hop の grep）
- 同じディレクトリ階層の **sibling config**
- 命名規則・正規化規則が **チーム内で揃っている** プロジェクト
- **〜10k ファイル程度** のリポジトリ

### 限界が見えるケース

- **再命名（rename）後の旧名参照**が ADR にしか残っていない
- **似て非なる概念**（`User` と `Account` が混在し、変更時に他方への影響を見落とす）
- **巨大 monorepo**（数十万ファイル、数百万行）で symbol grep 結果が爆発する
- ドキュメント（`docs/architecture.md`、`pages/explanation/*.md`）と実装の **意味的整合性チェック**

## 3. 候補アーキテクチャ（最低 2 案）

### 案 A: Local JSONL vector cache（recommend if MVP）

- 入力: `git ls-files` で取得した `*.{ts,tsx,js,mjs,md}` を **chunking**
- 埋め込みモデル: OpenAI `text-embedding-3-small`（軽量・安価）or BGE 系のローカル ONNX
- 出力: `.river/index/embeddings.jsonl`（1 行 = 1 chunk、`{path, startLine, endLine, hash, vector}`）
- 検索: コサイン類似度でメモリ内 top-k（10k chunk 程度なら数 ms で十分）
- インクリメンタル更新: chunk hash で差分検出、変更 chunk のみ再埋め込み
- 長所: secret leak リスクが最小、依存が単純（vector DB 不要）、CI cache に乗せやすい
- 短所: 巨大 monorepo（>100k chunk）でメモリ使用量が増える

### 案 B: Remote vector DB（Qdrant / Pinecone / Weaviate）

- 入力: 同上
- 埋め込みモデル: 同上
- 出力: managed vector store
- 検索: API 呼出
- 長所: monorepo スケーラビリティ、複数リポジトリ横断検索が容易
- 短所: secret 取扱いがシビア（コードがリモートに置かれる）、依存が増える、コスト増、CI 環境からの latency

### 案 C: Docs-only embedding（first step）

- 案 A のサブセット。`pages/`、`docs/`、`README*`、ADR のみ embedding。コード本体は引き続き ripgrep。
- 長所: privacy リスク最小（公開 docs のみ）、実装小、効果検証しやすい
- 短所: コード横断 retrieval は得られない

## 4. リスク整理

| カテゴリ               | リスク                                                                            | 緩和                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| privacy                | コード本体が外部 embedding API へ送信される                                       | local model（BGE-small ONNX）で full local 化、または案 C で docs-only                                     |
| secret leak            | `.env` 系がうっかり embed される                                                  | `.gitignore` 準拠 + 明示的 deny list（`schemas/exclude.schema.json` 流用）+ entropy ベースの secret detect |
| cost                   | OpenAI `text-embedding-3-small` で 10k chunk × 500 token = 約 \$0.10 / 全 reindex | 差分更新で月数十セント、初回のみ高コスト                                                                   |
| latency                | review 時に embed + retrieval を毎回するとレビュー応答が遅延                      | index は build time（CI）で作成、retrieval のみ review 時                                                  |
| determinism            | 同じ入力でも embedding 値が provider 側更新で変わる                               | model version pin、cache key に model name を含める                                                        |
| index 鮮度             | コードが進む速度に index 更新が追いつかない                                       | PR 時に変更 file 分のみ on-the-fly re-embed                                                                |
| dependency 増          | vector DB / model runtime の依存が CI に入る                                      | 案 A + ONNX で純 Node.js / WASM の範囲に収める、optional dependency                                        |
| eval drift             | embedding 入替で同じ PR の検出結果が変わる                                        | [#688 eval fixtures](https://github.com/s977043/river-reviewer/issues/688) に embedding on/off 軸を追加    |
| LLM hallucination 補強 | semantic retrieval で「もっともらしい無関係 chunk」を引いて LLM の幻覚を増やす    | retrieval スコア閾値、ripgrep heuristic との **and 結合**（embedding は ranking のみに使う）               |

## 5. GitHub Actions でのキャッシュ戦略

案 A 採用時:

- `actions/cache@v4` で `.river/index/` をキャッシュ。key は `${{ hashFiles('**/*.{ts,tsx,js,mjs,md}') }}-${{ env.MODEL_VERSION }}`。
- restore-keys で部分一致再利用 → 差分 chunk のみ再 embed。
- monorepo の場合は workspace 単位で分割キャッシュ。
- secret は `OPENAI_API_KEY` のみで済む（vector DB を使わない場合）。

## 6. monorepo 対応

- workspace 配列を `.river-reviewer.yaml` の `index.scopes: [packages/*]` で宣言（将来追加）
- chunk metadata に `scope: 'packages/foo'` を持たせ、retrieval 時に変更ファイルが属する scope 優先で top-k 取得
- 巨大化したら案 B（remote vector DB）の検討に切替

## 7. cost / latency 試算（案 A）

| 項目                       | 中規模 repo (5k files / 25k chunks) | 大規模 monorepo (50k files / 250k chunks) |
| -------------------------- | ----------------------------------- | ----------------------------------------- |
| 初回 embed コスト          | 約 \$0.25                           | 約 \$2.5                                  |
| 1 PR あたり差分 embed      | < \$0.001                           | < \$0.01                                  |
| index ファイルサイズ       | 約 30 MB                            | 約 300 MB                                 |
| retrieval latency (in-mem) | 1〜3 ms                             | 50〜100 ms                                |
| CI cache restore           | 数秒                                | 30 秒〜                                   |

> 試算は `text-embedding-3-small`（1536 次元 / 約 \$0.02 per 1M tokens）想定。

## 8. deterministic fallback

実装する場合でも、**embedding は補助情報のみ** に留め、retrieval が空でも heuristic 経路でレビューが完走することを保証します。具体的には:

1. embedding retrieval → top-k chunk 取得
2. 取得した chunk のうち **既存 ripgrep 結果に含まれないもの** を最大 N 件に絞り context に追加
3. embedding が無効化（`config.context.embedding.enabled=false`）/ index 不在 / API 失敗時は heuristic のみで動作

これにより既存の review 出力は **下位互換** を保てます。

## 9. ripgrep / heuristic との併用方針

- **ranking signal** として embedding score を [#689 token budget](https://github.com/s977043/river-reviewer/issues/689) の `pathProximity` / `symbolOverlap` 等と並列に追加（重み 0.10〜0.15）
- 候補集合の **生成** は引き続き heuristic（embedding を生成器に使うと幻覚が増える）
- 同一ファイルの heuristic 結果と embedding 結果が衝突したら heuristic 優先（ファイル単位 dedupe）

## 10. MVP として実装するか / 当面見送るか

**判断: 当面見送り。次のいずれかが起きた段階で再検討する。**

1. [#688 eval fixtures](https://github.com/s977043/river-reviewer/issues/688) で **heuristic では検出できないが embedding なら検出できる** ケースが 5 件以上記録される
2. 利用リポジトリが 50k file 規模に達し、symbol grep の S/N が悪化したという運用報告が出る
3. ADR / 仕様書 ↔ 実装の整合性チェックという新ユースケースが正式に Epic 化される

理由:

- 現時点の River Reviewer は upstream / midstream の skill 群が「変更ファイル ± 1 hop」に集中しており、heuristic で十分カバーできる
- embedding 導入は **依存・コスト・privacy リスク・eval drift** を一度に増やすため、得られる検出力 lift が定量化できるまでは回避すべき
- [#689 token budget + ranking](https://github.com/s977043/river-reviewer/issues/689) の効果が測定できれば、embedding なしでも ranking 改善で多くのケースが解決する見込み

## 11. 実装する場合の後続 Issue 案（先送り中の参考）

将来 embedding を入れると判断した際の Issue 分割案:

1. **secret detect + index exclude policy** — `.river/index.gitignore` 仕様、entropy 検出
2. **chunking strategy** — TS/JS の AST chunk vs naive line-window、md の heading chunk
3. **local embedder backend (案 A)** — ONNX runtime + BGE-small、CLI: `river index build`
4. **review-time retrieval integration** — `repo-context.mjs` への embedding ranker 追加
5. **CI cache strategy** — `.river/index/` の actions/cache 仕様、incremental update
6. **eval drift guards** — [#688](https://github.com/s977043/river-reviewer/issues/688) に embedding on/off 軸を追加
7. **docs-only first step (案 C)** — 段階導入したい場合の最小着地点

各 Issue は独立した PR で完結する単位を想定し、Epic として grouping するかは導入意思決定時に再判断します。

## 結論（要約）

- 現状は **heuristic + ripgrep + [#689 token budget/ranking](https://github.com/s977043/river-reviewer/issues/689) の改善** で十分
- embedding は **依存・privacy・cost・drift** のトレードオフが大きく、効果の定量化なしに導入すべきではない
- 案 A（Local JSONL vector cache）が最有力、案 C（docs-only）が段階導入の保険
- 上記 §10 の trigger 条件のいずれかが満たされた段階で本ノートを更新し、後続 Issue を起票する
