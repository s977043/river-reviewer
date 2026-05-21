---
id: intro
title: River Reviewer へようこそ
---

River Reviewer (RR) は、**チームのレビュー判断を skill として明示化・バージョン管理し、SDLC の各ゲートで実行する OSS フレームワーク**です。plan / diff / tests / JUnit / 既存レビュー結果といったアーティファクトをまたいで動作し、AI 支援開発における **チーム所有の監査レイヤー** として機能します。

## コアモデル

- **Skills define judgment** — skill は「どんなレビュー判断を行うか」を YAML frontmatter + Markdown で記述する。`schemas/skill.schema.json` で検証され、security / a11y / migration / dependency / plan conformance などの基準を載せる。
- **Gates execute judgment** — `river review plan` / `exec` / `verify` の 3 ゲートが、適切なタイミングで skill を実行する。PR 完成後だけでなく、設計時・実装中・検証段階のいずれでも動かせる。
- **Riverbed remembers judgment** — レビュー結果や決定は operating memory として残り、suppression や過去判断の再利用を通じて将来のレビューを一貫させる（[Riverbed Memory](./riverbed-memory.md)）。

このドキュメントでは以下をカバーします。

- **Explanation**: River Reviewer の設計思想と 3 層モデルの詳細
- **Tutorials**: skill 作成など手を動かす手順
- **How-to**: GitHub Actions 連携やトレーシングなどの実践ガイド
- **Reference**: スキーマや設定のリファレンス

まずは [River Reviewer とは](./what-is-river-reviewer.md) でコンセプトを把握し、必要に応じてチュートリアルやリファレンスを参照してください。コンセプト全体の SSoT は repo root の [`docs/vision.md`](https://github.com/s977043/river-reviewer/blob/main/docs/vision.md) です。
