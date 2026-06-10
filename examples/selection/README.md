# examples/selection/

`.river-review.yaml` の `selection` セクション（pack / tag / 個別 skill の宣言）のユースケース別サンプルです。

> **注意**: `selection` は設計段階の機能です。設計は [docs/development/skill-pack-design.md](../../docs/development/skill-pack-design.md) §6、実装は Phase B で行います。現時点では `--skill-set` フラグと registry.yaml の `recommendations:` を利用してください。

## サンプル一覧

| ファイル                   | 想定ユースケース                                                     |
| -------------------------- | -------------------------------------------------------------------- |
| `react-typescript.yaml`    | React + TypeScript（Next.js 含む）の Web アプリ開発                  |
| `tdd.yaml`                 | TDD チーム。テスト雛形生成からカバレッジ・flaky 検査まで             |
| `sdd.yaml`                 | 仕様駆動開発（SDD）。plan / pbi-input / ADR と実装の整合を多段で検査 |
| `architecture-review.yaml` | アーキテクチャ重視チーム。DDD 境界・契約・運用性のドリフト防止       |

## 使い方（selection 実装後）

1. サンプルの `selection` セクションを、自分のリポジトリの既存 `.river-review.yaml` に **マージ** する（`model` / `review` / `exclude` など既存セクションを上書きしないこと。config が無い場合はファイルごとコピーしてよい）
2. `selection.skills.include` をスタックに合わせて取捨選択する
3. `river run .` / GitHub Actions の両方が同じ宣言を読む

各サンプルの skill id は `skills/` 配下に実在するものだけを参照しています（一部は registry.yaml 未掲載のカタログドリフトあり）。優先順位は `exclude > include > packs / tags の union` です。
