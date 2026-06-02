---
id: intro
title: River Review へようこそ
---

River Review (RR) は、**チームのレビュー判断を skill として明示化・バージョン管理し、SDLC の各ゲートで実行する OSS フレームワーク**です。

River Review は、PR の差分だけを見るツールではありません。AI 支援開発で発生する **要件・設計・計画・差分・レポート** をレビュー対象として扱い、作業に入る前から完了後まで、チームの判断基準を一貫して適用します。

## River Review がレビューするもの

| 対象 | 目的 | 例 |
| --- | --- | --- |
| 要件 | 目的・成功条件・スコープの曖昧さを減らす | Issue、PBI、ユーザー要求、受け入れ条件 |
| 設計 | 既存設計との整合性、責務分離、過剰実装を確認する | ADR、設計メモ、アーキテクチャ方針 |
| 計画 | 作業分割、リスク、検証方針が実装前に揃っているか確認する | plan、Work Packet、テスト方針 |
| 差分 | 実装が要件・設計・計画と整合しているか確認する | PR diff、変更ファイル、テスト差分 |
| レポート | 判断根拠、検証結果、未解決事項が残っているか確認する | final report、レビュー結果、Evidence |

このため、River Review は **実行前レビュー** と **実行後レビュー** の両方に使えます。実装前には要件・設計・計画を確認し、実装後には差分・テスト・レポートを確認します。

## コアモデル

- **Skills define judgment** — skill は「どんなレビュー判断を行うか」を YAML frontmatter + Markdown で記述する。`schemas/skill.schema.json` で検証され、requirements / design / plan / diff / tests / report / security / a11y / migration / dependency などの基準を載せる。
- **Gates execute judgment** — SDLC の各ゲートで、対象アーティファクトに応じた skill を実行する。PR 完成後だけでなく、要件整理・設計・実装計画・検証・完了報告のいずれでも動かせる。
- **Riverbed remembers judgment** — レビュー結果や決定は operating memory として残り、suppression や過去判断の再利用を通じて将来のレビューを一貫させる（[Riverbed Memory](./riverbed-memory.md)）。

このドキュメントでは以下をカバーします。

- **Explanation**: River Review の設計思想と 3 層モデルの詳細
- **Tutorials**: skill 作成など手を動かす手順
- **How-to**: GitHub Actions 連携やトレーシングなどの実践ガイド
- **Reference**: スキーマや設定のリファレンス

まずは [River Review とは](./what-is-river-review.md) でコンセプトを把握してください。レビュー対象の整理は [レビュー対象と使いどころ](./review-scope.md) にまとめています。コンセプト全体の SSoT は repo root の [`docs/vision.md`](https://github.com/s977043/river-review/blob/main/docs/vision.md) です。
