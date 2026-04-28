# リポジトリ全体を踏まえたレビュー（repo-wide review）の導入とチューニング

このガイドは、River Reviewer を「PR 差分だけを見るレビュー」から「変更ファイル周辺のリポジトリ文脈を踏まえたレビュー」に発展させるための手順をまとめたものです。日本語が source of truth です（英語版は別 PR で追従）。

関連:

- 親 Epic: [#650 Greptile-inspired repo-wide review capabilities](https://github.com/s977043/river-reviewer/issues/650)
- 既存ガイド: [クイックスタート](./quickstart.md) / [GitHub Actions セットアップ](./github-actions.md) / [トラブルシューティング](./troubleshooting.md)
- 参考: [スキル作成ガイド](./write-a-skill.md) / [レビューポリシー](../reference/review-policy.md)

## このガイドが想定する読者

- River Reviewer を導入済みで、PR 差分のみのレビューから一歩進めたいチーム
- 変更ファイル単独では検出しづらい不整合（locale 未削除、normalization 不揃い、API 互換性、テスト欠落など）を拾いたい人
- 既存設定（`.river-reviewer.yaml`、`.river/rules.md`）の運用方針を整理したい運用担当者

## repo-wide review が解決する問題

PR 差分だけを見るレビューには次のような限界があります。

- 削除した翻訳キーに対応する `en.json` のエントリが残ることに気づけない
- 同じドメイン概念に対する命名・正規化が周辺コードと揃っているか確認できない
- API の互換性破壊が伴うべきテスト追加が漏れていないか確認できない
- 共通パターン（loading state、null 契約、observability など）と一貫しているか確認できない

repo-wide review は、変更ファイルから派生する「関連ファイル」「テスト」「symbol の利用箇所」「設定ファイル」を自動で集め、レビュー LLM のコンテキストとして併送します。これにより上記のような cross-file な不整合を拾える確率が上がります。

## 最小導入手順

1. リポジトリ直下に `.river-reviewer.yaml` を配置（後述の例を参照）。
2. `.river/rules.md` を作成（`.river/rules.template.md` を `cp` で複製）。
3. 必要なら `.river/risk-map.yaml` を追加（既定では `comment_only` のため省略可）。
4. GitHub Actions ワークフローを `.github/workflows/river-reviewer.yml` に追加。
5. `OPENAI_API_KEY` などのモデル鍵をリポジトリ Secrets に登録。
6. PR を作成し、コメントとして指摘が投稿されるか確認。

### 最小 GitHub Actions ワークフロー

```yaml
name: River Reviewer (repo-wide)
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
jobs:
  river-reviewer:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0 # repo-wide context collector が周辺コミット履歴を読むため必須
      - name: Run River Reviewer (midstream)
        uses: s977043/river-reviewer/runners/github-action@v0.14.1
        with:
          phase: midstream
          dry_run: false
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

> 例では `@v0.14.1` に固定しています。最新リリースが出た場合はそのタグへ置き換えてください。
>
> `fetch-depth: 0` は repo-wide context collector が変更ファイル周辺のコミット履歴・関連ファイルを参照するために必要です。shallow clone のままだと collector が劣化します。

## 設定ファイル

### `.river-reviewer.yaml`

`src/config/schema.mjs` の `riverReviewerConfigSchema` に対応する legacy 設定です。実例:

```yaml
model:
  provider: openai
  modelName: gpt-4o-mini
  temperature: 0.2
  maxTokens: 600
review:
  language: ja
  severity: normal
  additionalInstructions:
    - 'PR 差分だけでなく、変更ファイル周辺のテスト・locale・型定義との整合性を確認すること。'
    - 'Severity は critical / major / minor / info の 4 段階。Major 以上は具体的な根拠を必須とする。'
exclude:
  files:
    - 'package-lock.json'
    - 'pnpm-lock.yaml'
    - '**/*.snap'
  prLabelsToIgnore:
    - 'skip-review'
    - 'release'
```

> 設定値は zod でバリデーションされます。未知のキーは警告のみで実行は継続します（`src/config/loader.mjs` 参照）。

### `.river/rules.md`

リポジトリ固有のレビュー方針を Markdown で書き、LLM プロンプトへ自動注入します。`.river/rules.template.md` を複製して必要セクションだけ書き換えるのが推奨運用です。

```markdown
# Project-specific Review Rules

## Architecture / アーキテクチャ方針

- Next.js App Router、サーバーコンポーネントを優先する
- 共有ロジックは `src/lib/` 配下、UI は `src/components/` 配下に置く

## Forbidden Patterns / 禁止パターン

- `any` の使用（unknown + narrowing で代替）
- 同期的な fs 呼び出し（`fs.promises` を使う）
- React コンポーネント内での直接 `localStorage` アクセス

## Recommended Libraries / 推奨ライブラリ

- HTTP クライアント: `fetch` または `ky`
- 状態管理: Zustand
- 日付: `date-fns`（`moment` は禁止）

## Testing Requirements / テスト要件

- 新規 UseCase はユニットテスト必須（`tests/use-cases/` 配下）
- API 境界変更は統合テスト追加
```

> リポジトリの秘密情報（トークン、固有 ID）は書かないこと。例示する場合はダミー値を使います。

### `.river/risk-map.yaml`

ファイルパス glob ごとに「どの程度厳しくレビューするか」を宣言します。先頭から順にマッチし、最初にヒットしたルールが採用されます（first-match-wins）。`schemas/risk-map.schema.json` 参照。

```yaml
version: '1'
rules:
  - pattern: 'src/lib/security/**'
    action: require_human_review
    reason: 'セキュリティ系ロジックは LLM 単独で承認しない'
  - pattern: 'src/lib/payments/**'
    action: escalate
    reason: '決済まわりは Critical/Major を必ず major 以上に格上げ'
  - pattern: 'pages/**/*.md'
    action: comment_only
    reason: 'ドキュメントは指摘を出すが gating はしない'
defaults:
  action: comment_only
```

`action` の意味（`schemas/risk-map.schema.json` の enum）:

| action                 | 挙動                                                          |
| ---------------------- | ------------------------------------------------------------- |
| `comment_only`         | 通常通り指摘を投稿。マージのブロックはしない                  |
| `escalate`             | 指摘の severity を引き上げ、PR コメント先頭に注意喚起を強める |
| `require_human_review` | LLM レビューに加え、人間レビュアー必須の警告を PR に明示する  |

## repo-wide context collector の挙動

変更ファイルから次の 4 セクションを集めます（実装: `src/lib/repo-context.mjs`）。

| セクション | 取得元                                      | 既定の上限   |
| ---------- | ------------------------------------------- | ------------ |
| `fullFile` | 変更ファイル本体（最大 5 ファイル）         | 約 3000 文字 |
| `tests`    | path heuristic で見つけた対応テスト         | 約 2000 文字 |
| `usages`   | `rg` で grep した export symbol の使用箇所  | 約 1500 文字 |
| `config`   | sibling な設定ファイル（`.json` / `.yaml`） | 約 500 文字  |

合計上限は既定 8000 文字（`maxChars` で上書き可）。各セクションは末尾から `// ...[truncated]` で切り詰めます。

`rg`（ripgrep）が利用できない環境では `usages` セクションが best-effort で空になります。CI ランナー側にあらかじめ ripgrep を入れておいてください（GitHub Actions の標準 Ubuntu イメージには同梱）。

### context budget / ranking の調整方針

> このセクションは **計画中** です。token 単位の budget、`reviewMode`（tiny / medium / large）連動、ranking score（path proximity、symbol overlap、commit recency など）は [Issue #689](https://github.com/s977043/river-reviewer/issues/689) で追跡しています。実装後は本ガイドに具体的な YAML キーを追記します。

現状取れる調整は次の通りです。

- `.river-reviewer.yaml` の `model.maxTokens` を引き上げる（応答上限）
- ノイズが多いと感じたら `.river-reviewer.yaml` の `exclude.files` を強化する（例: 自動生成物、lock file、snapshot）
- `risk-map.yaml` の `action: comment_only` を docs に当てて gating だけ外す

## cross-context skills の追加方法

cross-context skills は、変更ファイル単独では検出しづらいパターンを集めたスキル群です。`skills/midstream/rr-midstream-*-001/` 配下に既に以下が同梱されています（[Issue #654](https://github.com/s977043/river-reviewer/issues/654) で完了）。

- `rr-midstream-i18n-unused-key-001` — 翻訳キーの削除と locale エントリの整合
- `rr-midstream-normalization-consistency-001` — ドメイン正規化（ID 形式、小文字化など）の不揃い
- `rr-midstream-loading-state-001` — early return / loading state の遷移漏れ
- `rr-midstream-nullability-contract-001` — null/undefined 契約の崩れ
- `rr-midstream-api-compatibility-001` — API 互換性破壊と対応テスト欠落

新しい cross-context skill を追加する手順は [スキル作成ガイド](./write-a-skill.md) を参照してください。要点だけ抜粋すると:

1. `skills/midstream/rr-midstream-<your-skill>-001/SKILL.md` を作る（YAML frontmatter + 本文）。
2. `inputContext` に `diff` だけでなく `fullFile` を含めると collector の出力が LLM へ渡ります。
3. fixture を `fixtures/01-should-detect.md` / `02-should-not-detect.md` に置く。
4. `npm run skills:validate` で schema を検証。

## P1 / P2 / P3 / P4 priority の読み方

LLM が出力する severity（`critical` / `major` / `minor` / `info`）は、PR コメント上では P1〜P4 にマッピングして表示されます（実装: `src/lib/finding-format.mjs:severityToPriority`）。

| 表示 | severity   | 例                                                           |
| ---- | ---------- | ------------------------------------------------------------ |
| P1   | `critical` | セキュリティ脆弱性、データ損失リスク、システムダウンの可能性 |
| P2   | `major`    | 重大なバグ、パフォーマンス問題、設計上の大きな問題           |
| P3   | `minor`    | 小さなバグ、可読性の問題、軽微な最適化の機会                 |
| P4   | `info`     | 提案、参考情報、追加の検討事項                               |

PR コメントの先頭サマリには P1 / P2 件数が強調表示され、`risk-map.yaml` で `require_human_review` がヒットしたパスは「人間レビュー必須」と明示されます（[Issue #652](https://github.com/s977043/river-reviewer/issues/652) で完了）。

## false positive suppression memory（計画中）

「これは false positive だった」「accepted_risk として了承済み」というフィードバックを蓄積し、同じ fingerprint の指摘が再発しないよう抑制する仕組みは [Issue #687](https://github.com/s977043/river-reviewer/issues/687) で追跡しています。

現状でも以下の基盤は実装済みです。

- finding fingerprint 生成（`src/lib/finding-fingerprint.mjs`）
- Riverbed Memory への suppression entry 書込（`src/lib/suppression.mjs`、`type: 'suppression'`）
- レビュー時に wontfix エントリをプロンプトへ注入（`src/lib/memory-context.mjs`）

未実装なのは「fingerprint で指摘を自動抑制するゲート」と「`feedbackType` 別の取扱い差（critical は `accepted_risk` のみ抑制を許す等）」です。実装後は CLI（例: `river suppression add --finding <fingerprint> --feedback false_positive`）と config フラグ（`memory.suppressionEnabled`）を本ガイドに追記します。

## eval fixtures の実行方法（計画中）

「context あり/なしで検出差を計測する」regression fixtures は [Issue #688](https://github.com/s977043/river-reviewer/issues/688) で追跡しています。実装後は次のコマンドで実行できる予定です。

```bash
npm run eval:repo-context
```

現状利用できる近い評価系は次の通りです。

```bash
npm run eval:fixtures   # 既存の review fixture eval（PR 差分のみ）
npm run eval            # 統合 eval driver（planner / fixtures / gate / meta）
```

`tests/fixtures/review-eval/cases.json` の構造を `tests/fixtures/repo-wide-eval/` に派生させる前提で設計が進んでいます（詳細は Issue #688）。

## troubleshooting

### context が空で投入されている

- `actions/checkout` の `fetch-depth: 0` が設定されているか確認。shallow clone だと collector が動作しないことがあります。
- ripgrep が runner にあるか（`which rg`）。GitHub Actions の標準 Ubuntu イメージには同梱されています。
- `dry_run: true` のままになっていないか。dry run は LLM を呼ばず heuristic 出力のみ返すため、context が薄い指摘になりがちです。

### コメントが投稿されない

- workflow の `permissions` に `pull-requests: write` と `issues: write` があるか。
- フォークからの PR は secrets が伝播しないので、外部コントリビューターの PR でレビューを動かすには `pull_request_target` 等を選び、安全側で実装する必要があります（[github-actions ガイド](./github-actions.md)）。

### 指摘が多すぎる / 少なすぎる

- `.river-reviewer.yaml` の `review.severity` を `strict` / `relaxed` で切替。
- ノイズが多いパス（自動生成物、ベンダー）を `exclude.files` に追加。
- 逆に「ここだけは厳しく見たい」パスは `risk-map.yaml` の `action: escalate` で持ち上げる。

### 同じ指摘が毎回出る

- 暫定的には `.river/rules.md` の `## Forbidden Patterns` に「これは許容済み」と明記すると LLM 側で抑止されることがあります。
- 体系的な抑制は Issue #687 の suppression memory が必要（計画中）。

### 設定ファイルが反映されない

- `river run . --dry-run --debug` で読込ログを確認（`.river/rules.md` の認識確認に使えます）。
- `.river-reviewer.yaml` の YAML 構文エラーは loader が警告を出します。zod バリデーション失敗時はメッセージを参照して直してください。

## さらに読む

- [レビューポリシー](../reference/review-policy.md) — Severity の定義と運用基準
- [Riverbed Memory](./use-riverbed-memory.md) — wontfix / suppression エントリの書込先
- [スキル作成ガイド](./write-a-skill.md) — cross-context skill の追加手順
- [Tracing / Observability](./tracing.md) — 実行時のメトリクスとデバッグ出力
