# River Review in the Generate → Review → Revise Loop

本 doc は、River Review を generate → review → revise の改善ループにおける **review ステージ** として位置づけ、未充足の **Agent 層 / Loop 駆動 / Review Team** を設計する。#976（[review-gates-design.md](../development/review-gates-design.md)）と #1148（plan-review-gate）を土台とし、[eos-overview.md](./eos-overview.md) の EOS 5 層に接続する。

新規 top-level command は追加しない（#1024 / #976 の方針を継承）。既存の findings / verdict / Agent Handoff / memory-context を**ループ部品として束ねる**ことに徹する。

## TL;DR

- River Review の中核価値は「賢いプロンプト集」ではなく、generate → review → revise ループに差し込める **verdict 付き critic** である。
- このループに必要な 3 部品（機械可読 critic 出力 / 収束ゲート / 回帰メモリ）は**既存資産でほぼ充足している**。
- 欠けているのは、それらを束ねる **Agent 層**（critic API / マルチエージェント review team / 収束制御）だけである。
- #976 は「ステージ別ゲート + verdict」を、#1148 は「plan 高度のゲート」を埋めた。本 doc は**そこに "ループ反復" と "エージェントチーム" の軸**を足す。

## review ステージの 3 要件

自律エージェントが回すループの review ステージは、人間向けレビューと異なる 3 要件を持つ。各要件は既存資産で再利用できる。

- 機械可読 critic 出力: revise する AI が次アクションへ変換できる構造。`findings` / `verdict` / Agent Handoff（`agentHandoff` config）が素地。
- 収束ゲート: ループ停止条件。`deriveVerdict` の 3 値（auto-approve / human-review-recommended / human-review-required）をそのまま使える。
- 回帰メモリ: 振動（fix A により break B、次周で B が再出現）の検知。`memory-context` / `suppression` が過去の finding を追跡する。

3 要件とも素地は既にあるため、欠けているのは束ね役の Agent 層のみです。

## 同じループの 2 altitude

generate → review → revise は適用高度が違うだけの同一ループです。Agent 層を 1 つ設計すれば 2 インスタンスを賄え、二重実装を避けられます。

| 対象 | generate  | review                       | revise    |
| ---- | --------- | ---------------------------- | --------- |
| 計画 | plan 作成 | plan-review-gate（#1148）    | plan 修正 |
| 差分 | 実装      | code review（既存 skill 群） | diff 修正 |

## 収束制御

review を自律ループへ置くと、#976 の単発ゲートには無い制御が要る。

- 停止条件: `auto-approve` は収束、`human-review-required` は即 escalate（回さない）、`human-review-recommended` は revise して再 review。
- 発散ガード: max iterations 上限と「新規 finding ゼロが N 周連続（loop-until-dry）」。
- 振動検知: 同一 finding（同 ruleId と file、近傍 line）が再出現したら「revise が別問題を生んだ」と判定し escalate する。
- コスト上限: 1 ループあたりのトークン予算とイテレーション予算（#921 cost control mode の接続点）。

## マルチエージェント Review Team

現状の `agents/river-review.md` は単一エージェントが skill を逐次ルーティングする。これを観点分業の並列チームへ昇格する。

```text
            ┌─ security-reviewer      (security / privacy / authz cluster)
orchestrator┼─ architecture-reviewer  (boundaries / data-flow / contracts)
 (router +  ┼─ performance-reviewer   (perf / cache / capacity)
  merger)   ┼─ testing-reviewer       (test-code / validation-plan)
            └─ adversarial-reviewer   (pre-mortem / war-game)
                  │ 並列実行
                  ▼
        findings 統合 → dedup → cross-verify → scoreReview → 単一 verdict
```

- 分業軸: skill の category（upstream / midstream / downstream）と観点 cluster。
- 並列: 各 reviewer は独立 sub-agent とする（fan-out / verify パターン）。
- 統合: 既存の `scoreReview` / `deriveVerdict` を merger に流用し、並立システムを作らない。
- adversarial 段: 他 reviewer の finding を反証し、false-positive を抑制する。

単一エージェントとの差分は次の 3 点です。逐次から並列へ、観点混在から専門分業へ、自己検証のみから相互反証へ、と変わります。

## EOS 5 層へのマッピング

| EOS 層                   | 本 doc の貢献                                                   |
| ------------------------ | --------------------------------------------------------------- |
| 1. Skills                | 既存（reviewer が読む観点）                                     |
| 2. Evaluation            | review team の統合品質を fixture 化し、ループ収束を回帰防止する |
| 3. Metrics               | iteration 数 / 収束率 / 振動率を新規 KPI とする                 |
| 4-5. Governance / Memory | 振動検知に memory-context、escalate を governance へ接続する    |
| Agent（新設）            | critic API / review team orchestrator / 収束制御                |

## 既存資産との重複・非重複

- #976 review-gates-design.md: ステージ別ゲートと verdict のパターンは既出。本 doc は重複せず「ループ反復」「エージェントチーム」「収束 / 振動制御」を追加する。
- #1148 plan-review-gate: 本ループの plan 高度インスタンスとして内包する。
- #921 cost control: 収束制御のコスト上限の接続先とする。
- IMPROVEMENT_LOOP.md（9 ステップ）: あれは skill 改善の外側ループ（feedback → fixture → eval）である。本 doc は diff / plan を直す内側ループ（generate → review → revise）であり、二重ループ構造として両立する。

## Epic スライス案

実装は着手前に人間承認を要する。

| スライス | 内容                                                                             | 依存         |
| -------- | -------------------------------------------------------------------------------- | ------------ |
| S1       | critic API: `river run` の verdict と handoff をループ消費可能な契約として固める | 既存ほぼ完成 |
| S2       | 収束制御: 停止 / 発散ガード / 振動検知のロジック（`deriveVerdict` 周辺）         | S1           |
| S3       | review team orchestrator: 並列 sub-agent と merger（PoC から）                   | S1           |
| S4       | plan-review-gate（#1148）を S1〜S3 の plan 高度インスタンスとして実装            | S1〜S3       |

## 未確定事項

- Epic 起票時の #976 / #1148 / #921 との親子関係。
- review team をマルチエージェントで実装するか、軽量な逐次 fallback も残すか。
- いずれもアーキ変更であり、実装着手前に人間承認が必要である。
