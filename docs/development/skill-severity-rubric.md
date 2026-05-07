# Skill Severity Rubric

A skill's `severity` frontmatter declares the **maximum severity** the skill is allowed to emit, and is also the default for findings whose severity is not explicitly set in the prompt. The runner normalizes downstream values via `severityToPriority` (`src/lib/finding-format.mjs`) into the P1〜P4 PR-comment display.

This document codifies objective criteria for choosing a skill's `severity`, so future authors classify consistently and existing skills can be re-audited against the rubric.

## Severity values

| value      | display | meaning                                                              | example domains                               |
| ---------- | ------- | -------------------------------------------------------------------- | --------------------------------------------- |
| `critical` | P1      | merge をブロックすべき不具合（セキュリティ・データ破損・本番ダウン） | secret leak, SQL injection, data corruption   |
| `major`    | P2      | merge 前に解消が望ましい（本番影響はあるが致命的ではない）           | breaking API change, missing test, design gap |
| `minor`    | P3      | follow-up で良い（小バグ・可読性・軽微な不整合）                     | naming, formatting drift, redundant code      |
| `info`     | P4      | 観察・議題提示のみ（直接の修正ではなく、議論を促す）                 | style note, governance reminder, FYI link     |

## Decision criteria

A skill's `severity` is decided by the **worst case finding it is allowed to emit**, not the average finding. Use the most restrictive criterion that holds.

### `critical`—P1

すべて満たす必要がある:

1. 検知対象が **本番動作に直接影響** する（merge してデプロイされた瞬間にユーザー影響が発生）
2. **自動的な検知精度が高い** （high confidence でないと critical 出力は鬱陶しい）
3. 検知後の修正が **mandatory**（"discuss later" の余地がない）

例: `rr-upstream-trust-boundaries-authz-001`（認可境界の崩れ → 不正アクセス）

### `major`—P2

以下のいずれかを満たす:

1. 検知対象が **設計レベルで「正しいが甘い」** ケース（例: failure mode の欠落、breaking change の見落とし）
2. 検知対象が **コード品質的に「直すべき」** が、緊急ではない（例: missing test, type unsafety）
3. **upstream / midstream** の主要レビュースキルで、accepted_risk として明示同意されない限り解消が期待される

`major` は **HIGH_SEVERITY guard** の対象。`accepted_risk` 以外の feedbackType では auto-suppression されない（`feedback_to_fixture` 参照）。

### `minor`—P3

以下のいずれかを満たす:

1. 検知対象が **小さな品質改善**（naming, formatting, dead code, 軽微な inconsistency）
2. 検知対象が **テスト構造 / docs** の改善で、追加修正なしで merge 可能
3. **教育・案内**目的のスキル（例: 命名ガイドの提示）

`minor` は guard で auto-suppress 可。多数の `minor` を 1 PR に出すよりも、root cause を 1 つの `major` で示す方が伝わる。

### `info`—P4

以下のいずれかを満たす:

1. 検知対象が **議題提示**（「この PR では議論が必要かもしれない」）で、修正候補を断定できない
2. **governance / process** 観点（"このディレクトリは team X の owner です" 等のリマインダ）
3. 既存の **suppression / accepted_risk** が covering している既知ケースの acknowledgement

`info` finding は CI ゲートに使うべきでない。観察ログとしてのみ機能する。

## Stream による上限ガイダンス

各 stream で **最も典型的な severity** を以下に示す。これは強制ではないが、stream の本来責務と severity が大きくズレる場合（例: midstream の review-process skill が `critical`）は再検討する。

| stream     | 想定既定                 | 例外的に許容される severity                                                         |
| ---------- | ------------------------ | ----------------------------------------------------------------------------------- |
| upstream   | `major`（design / spec） | `critical`（trust-boundaries / auth）                                               |
| midstream  | `major`（実装ガード）    | `critical`（security-basic / secret leak）, `minor`（agent-\* / typescript-strict） |
| downstream | `major`（test gap）      | `minor`（naming）                                                                   |

## 再分類のチェックリスト

既存 skill の severity を見直すときは、以下を確認:

- [ ] そのスキルの **happy-path fixture / golden** で出ている finding の severity と一致するか
- [ ] **never-selected** な skill（planner-eval `selectedIds` に出ない）でないか—出ないなら severity を変えても影響範囲がわかりにくい
- [ ] HIGH_SEVERITY guard を意識すべきスキル（major/critical で `accepted_risk` 以外は弾かれる）か
- [ ] 同じ stream / domain の他スキルと比べて **明らかに 1 段階 zoom-in / zoom-out** していないか

## 観察された分布（参考、2026-05-07 時点）

| stream     | major | minor | info | critical |
| ---------- | ----- | ----- | ---- | -------- |
| upstream   | 75%   | 18%   | 4%   | 2%       |
| midstream  | 57%   | 34%   | 7%   | -        |
| downstream | 77%   | 11%   | 11%  | -        |

`major` が dominant な分布は、River Reviewer のレビュー対象が「設計・実装・テスト不備」を主軸にしている以上自然。ただし以下のような **再検討候補** が含まれる:

- 全 stream で、命名・formatting 系のスキルが `major` になっていないか（ある場合は `minor` 化を検討）
- agent-\* skill 群で、汎用レビュースキルが `major` 過剰になっていないか（ある場合は `minor` 化を検討）

具体的な再分類は **個別 PR** で行う。本ドキュメントは方針のみを定義し、再分類による個別影響評価は PR ごとに `npm run planner:eval:dataset` の coverage / top1Match と `npm run eval:fixtures` で検証する。

## 再分類の運用ルール

- 1 PR で **同時に 2 つ以上の skill の severity を上げ下げしない**（影響の切り分けが困難になる）
- severity を変える PR は本書の該当節に明示的にリンクし、判断根拠を 3 行で書く
- 変更前後で `npm run eval:all` の主要メトリクスを記録し、PR 本文に before / after を残す

## References

- 出力スキーマ: `docs/review/output-format.md`
- 重要度語彙マッピング: `.claude/rules/review-core.md`
- HIGH_SEVERITY guard: `skills/agent-skills/river-reviewer/references/FEEDBACK_TO_FIXTURE.md`
- planner-eval の使い方: `tests/fixtures/planner-dataset/README.md`
