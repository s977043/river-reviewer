# スキル構造設計書

Issue #310: 目標ディレクトリ構造・粒度の決定（入口 + 専門）

---

## 現状の構造

```text
skills/
├── upstream/      # 40 スキル（設計・アーキテクチャレビュー）
├── midstream/     # 17 スキル（コード・実装レビュー）
├── downstream/    # 9 スキル（テスト・QAレビュー）
├── registry.yaml  # スキル登録
└── _template.md   # スキルテンプレート
```

## 目標構造

### Agent Skills 形式への移行

```text
skills/
├── agent-skills/           # Agent Skills 公式仕様準拠
│   ├── river-review/       # 入口スキル（ルーター）
│   │   ├── SKILL.md
│   │   └── references/
│   ├── river-review-security/
│   │   ├── SKILL.md
│   │   └── references/
│   ├── river-review-architecture/
│   │   ├── SKILL.md
│   │   └── references/
│   └── ...
├── upstream/               # 従来形式（移行元）
├── midstream/              # 従来形式（移行元）
└── downstream/             # 従来形式（移行元）
```

---

## 入口スキル: `river-review`

### 役割

- **ルーター**: 入力に応じて適切な専門スキルへ案内
- **分類基準**: フェーズ（upstream/midstream/downstream）と観点（security/performance 等）
- **Progressive Disclosure**: 詳細は専門スキルに委譲

### SKILL.md 骨格

```yaml
---
name: river-review
description: River Reviewer のメインエントリポイント。レビュー依頼を適切な専門スキルへルーティングする。
---
```

### 導線定義

| 入力キーワード         | 導線先スキル                |
| ---------------------- | --------------------------- |
| 設計、アーキ、ADR      | `river-review-architecture` |
| セキュリティ、脆弱性   | `river-review-security`     |
| パフォーマンス、最適化 | `river-review-performance`  |
| テスト、カバレッジ     | `river-review-testing`      |
| （上記以外）           | `river-review-code`         |

> **デフォルト動作**: キーワードがどれにも当てはまらない場合は `river-review-code`（一般コードレビュー）にフォールバックする。これにより、すべてのレビュー依頼が適切に処理される。

---

## 専門スキル群

### 命名規則

```text
river-review-<domain>
```

- `domain`: 観点を表すケバブケース（例: `security`, `architecture`, `testing`）

### 推奨専門スキル

| スキル名                    | 担当フェーズ       | 説明                         |
| --------------------------- | ------------------ | ---------------------------- |
| `river-review-architecture` | upstream           | 設計・アーキテクチャレビュー |
| `river-review-security`     | upstream/midstream | セキュリティ観点レビュー     |
| `river-review-api`          | upstream           | API 設計・契約レビュー       |
| `river-review-code`         | midstream          | 一般コード品質レビュー       |
| `river-review-testing`      | downstream         | テスト観点レビュー           |

---

## 責務分担

| 配置場所      | 内容                                                 |
| ------------- | ---------------------------------------------------- |
| `SKILL.md`    | 手順骨格、トリガー条件、出力フォーマット（短く保つ） |
| `references/` | チェックリスト、具体例、詳細説明                     |
| `scripts/`    | 自動化スクリプト（必要に応じて）                     |
| `assets/`     | 図表など（必要に応じて）                             |

---

## 行数ガイドライン

- **SKILL.md**: 推奨 100行以下、上限 200行
- **references/**: 制限なし（詳細はここに集約）

---

## 移行方針

1. **Phase 1**: 入口スキル `river-review` を作成
2. **Phase 2**: 高優先度の専門スキルを作成（security, architecture, code）
3. **Phase 3**: 従来スキルの内容を専門スキルへ統合
4. **Phase 4**: 従来スキルを deprecated 化

### Phase 4: Deprecated 化の具体的手順

1. `registry.yaml` で従来スキルに `deprecated: true` フラグを設定
2. 各スキルファイルの冒頭に deprecation 警告を追記
3. ドキュメント（README, CONTRIBUTING）に移行先を明記
4. 3ヶ月の猶予期間後、次のメジャーバージョンで従来スキルを削除

---

## 次のアクション

- [ ] `skills/agent-skills/` ディレクトリを作成
- [ ] 入口スキル `river-review` を作成
- [ ] テンプレート（#311）を使用して専門スキルを追加
