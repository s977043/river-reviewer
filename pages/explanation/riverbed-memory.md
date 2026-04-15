---
id: riverbed-memory
title: Riverbed Memory
---

:::info[v1 実装済み]
Riverbed Memory v1 は既に実装されています (#474, `src/lib/riverbed-memory.mjs`)。

- JSON エントリは `schemas/riverbed-entry.schema.json` に準拠し、`.river/memory/index.json` へ追記される。
- CI では `.github/workflows/riverbed-persist.yml` 経由で GitHub Artifact に永続化される。
- 利用方法は [Riverbed Memory を使用する](../guides/use-riverbed-memory.md) を参照する。
- v2 (外部データストア連携) は将来計画である。

:::

## 概要

Riverbed Memory は、コンテキストを保持するためのレイヤーです。川底が過去の流れの痕跡を保持するように、アーキテクチャ上の決定、WontFix 項目、過去のレビュー結果を記憶し、River Reviewer が PR やリリース間で一貫性を保てるようにします。流れを安定させる軽量で監査可能な記憶層と捉えてください。

実装と運用手順は `pages/guides/use-riverbed-memory.md`、ストレージ詳細は `pages/reference/riverbed-storage.md` を参照してください。

## スコープ (v0 → v1 → v2)

- **v0: ステートレス**—永続化されたコンテキストはなく、各レビューは独立。初期リリース時の挙動。
- **v1: 最小限のメモリ (現在)**—`schemas/riverbed-entry.schema.json` に準拠した JSON レコードを `.river/memory/index.json` へ追記。`npm run eval:all -- --persist-memory` で eval 結果を自動保存できる。CI では GitHub Artifact 経由で 90 日間保持 (`.github/workflows/riverbed-persist.yml`)。
- **v2: 外部化されたメモリ (計画中)**—リポジトリ間の想起や長期間の履歴を必要とするチーム向けの、オプションの Postgres/Redis/ベクターストア バックエンド。

## ストレージオプション

- **隠しマーカー付き GitHub PR コメント**: 検査は容易で、再実行後も残る。サイズの制限はあるものの、ノイズの多い通知を避けるようにする。
- **GitHub Artifacts (PR ごとの .json)**: v1 の標準。安価で監査可能、スナップショット用途に向く。保持ポリシーが過ぎると期限切れとなる点に注意。
- **`.river/memory/index.json` (リポジトリ内)**: v1 の既定。コードと一緒にバージョン管理される。ローカルのみで運用したい場合は `.gitignore` 経由で管理する。
- **外部データストア (Postgres/Redis/vector DB)**: v2 で導入予定。スケーラブルで意味的な想起を可能にする一方、運用のオーバーヘッドとシークレット管理が追加される。

## 設計トレードオフ

- **コスト**: コメントは無料、アーティファクトは安価、外部ストアはインフラコストが発生する。
- **複雑さ**: コメント/アーティファクトは単純。リポジトリファイルは書き込みパスとマージ戦略が必要。外部 DB はサービスとローテーションが必要。
- **セキュリティ**: コメント/アーティファクトは GitHub スコープ内に存在。リポジトリファイルはリポジトリ ACL を継承する。外部ストアはシークレット処理とネットワークポリシーが必要。
- **監査可能性**: コメントとリポジトリファイルは人間が読める。アーティファクトは検索可能。外部ストアは明示的な保持/バックアップが必要。

## v2 に向けた検討事項

1. クロスリポジトリ想起の API 形状 (pull / push / 検索)。
2. ベクター DB を採用する場合の埋め込みモデル選定とコスト試算。
3. `.river/memory/index.json` との同期戦略 (ローカル優先 / リモート優先 / マージ)。
