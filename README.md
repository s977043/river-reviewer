# River Reviewer

**Turn Implicit Knowledge into Reproducible Agent Skills.**
**暗黙知を再現可能な「Agent Skills」に変える、AIコードレビューの実験的フレームワーク**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-available-blue)](https://river-reviewer.vercel.app/explanation/intro/)

![River Reviewer logo](assets/logo/river-reviewer-logo.svg)

日本語版READMEです。[English README is available here.](./README.en.md)

## ライセンス概要

| 対象                                          | ライセンス | 詳細                                 |
| --------------------------------------------- | ---------- | ------------------------------------ |
| ソースコード (`src/`, `scripts/`, `tests/`)   | MIT        | [LICENSE-CODE](./LICENSE-CODE)       |
| ドキュメント (`pages/`, `skills/`, `assets/`) | CC BY 4.0  | [LICENSE-CONTENT](./LICENSE-CONTENT) |
| 設定ファイル (`.github/`, `*.config.*`)       | MIT        | [LICENSE](./LICENSE)                 |

## はじめに

| やりたいこと             | 行き先                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| 5分で試す                | [クイックスタート（GitHub Actions）](#クイックスタートgithub-actions)                              |
| 既存リポジトリに導入する | [セットアップガイド](https://river-reviewer.vercel.app/guides/github-actions/)                     |
| スキルを1個作る          | [スキル作成チュートリアル](https://river-reviewer.vercel.app/tutorials/creating-your-first-skill/) |
| 設計思想を理解する       | [アーキテクチャ解説](https://river-reviewer.vercel.app/explanation/river-architecture/)            |

Philosophy: [なぜ作ったのか](#philosophy)

開発手順は [docs/runbook/dev.md](docs/runbook/dev.md) を参照してください。

**River Reviewer は Context Engineering に基づく Skill Registry 中心のコードレビューフレームワークです。**

チーム固有のレビュー知識を「スキル」として明示化・バージョン管理し、GitHub Actions/CLI/Node APIなど、あらゆる環境で再利用できます。スキルはテスト可能で、継続的に改善できる資産です。

<a id="philosophy"></a>

## 📖 The Philosophy (なぜ作ったのか)

> **We stopped believing "polish the prompt and you win."**
> **「プロンプトを磨けば勝てる」をやめました。**

AIレビューの実用化における最大の壁は、プロンプトの精度ではなく「レビュー指摘の再現性」と「運用コスト」でした。
River Reviewer は、単にコードをAIに読ませるツールではありません。

チーム固有の「判断基準」や「手順」といった暗黙知を、**再利用可能な「Agent Skills（マニュアル付きの道具箱）」** として定義し、組織の資産として育てるための実験的フレームワークです。

さらに、レビューの「自由度」をリスクで設計し、**HITL（Human-in-the-Loop）** を前提にした Plan / Validate / Verify の運用で、実務に耐える再現性を確保します。

要点は次の3つです。

- **Agent Skills**: 暗黙知をレビュー資産として明示化し、継続的に改善できる状態にする。
- **自由度の設計**: 崖・丘・原っぱのリスク設計で、AIの裁量と検証コストを制御する。
- **HITLワークフロー**: 実行前に計画を人が検証し、レビュー結果は検証可能にする。

🔗 **Read the full story (Japanese):**
[「プロンプトを磨けば勝てる」をやめた：AIレビューを運用に乗せる“Agent Skills”設計](https://note.com/mine_unilabo/n/nd21c3f1df22e)

## フローのストーリー

- **上流（設計）**: ADR を踏まえたチェックでコードのドリフトを防ぎ、アーキテクチャ判断との整合を保ちます。
- **中流（実装）**: スタイルと保守性のガードレールで日々のコーディングを支援します。
- **下流（テスト/QA）**: テスト指向のスキルがカバレッジ不足や失敗パスを浮かび上がらせます。
- **フェーズ指向ルーティング**: `phase` とファイルメタデータを見て、開発段階に合ったスキルを選択します。

## ポジション: artifact-driven review agent

River Reviewer は **PlanGate 非依存の artifact-driven review agent** です。PlanGate v6 などの上流ワークフローに特別な統合を前提とせず、外部から渡されるアーティファクト（`plan` / `diff` / `test-cases` / `junit` ほか）を入力として読み取り、`findings` を含むレビュー結果を出力します。入力の契約は [Artifact Input Contract](pages/reference/artifact-input-contract.md) で、出力スキーマは [Review Artifact](pages/reference/review-artifact.md) で定義されています。

### 4 つのユースケース

同じ CLI（`river review plan` / `river review exec`）が、入力として渡すアーティファクトの組み合わせでユースケースを切り替えます。

- **設計レビュー**: `pbi-input` / `plan` を入力に、計画の整合性・網羅性を上流 skill で検査します（例: `skills/upstream/rr-upstream-plangate-plan-integrity-001/`）。
- **実装レビュー**: `plan` と `diff` を入力に、実装差分が計画と一致しているかを検査します（例: `skills/upstream/rr-upstream-plangate-exec-conformance-001/`）。
- **QA レビュー**: `test-cases` / `junit` / `coverage` を入力に、テストカバレッジや失敗パスの抜けを下流 skill で浮かび上がらせます。
- **W チェック（二重レビュー）**: 既存の AI / 人間レビュー結果を `review-self` / `review-external` として渡し、レビューそのものを再点検します。

### CLI 利用例

詳細な仕様は [`river review plan` CLI 仕様](pages/reference/cli-review-plan-spec.md) / [`river review exec` CLI 仕様](pages/reference/cli-review-exec-spec.md) を参照してください。

```bash
# 設計レビュー: plan 単体を検査
river review plan --artifact plan=./artifacts/plan.md

# 実装レビュー: plan と diff の整合性を検査
river review exec \
  --artifact plan=./artifacts/plan.md \
  --artifact diff=./artifacts/diff.patch

# QA レビュー: テスト観点のアーティファクトを追加
river review exec \
  --artifact diff=./artifacts/diff.patch \
  --artifact test-cases=./artifacts/test-cases.md \
  --artifact junit=./artifacts/junit.xml
```

## クイックスタート（GitHub Actions）

`v1` タグを使った最小構成のワークフロー例です。`phase` は将来拡張を見据えた任意入力で、SDLC のフェーズごとにスキルを振り分けます。Permissions/fetch-depth などを明示して安定動作させます。

```yaml
name: River Reviewer
on:
  pull_request:
    branches: [main]
jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0 # merge-base を安定取得
      - name: Run River Reviewer (midstream)
        uses: s977043/river-reviewer/runners/github-action@v0.13.0
        with:
          phase: midstream # upstream|midstream|downstream|all (future-ready)
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

タグは `@v0.13.0` などのリリースタグにピン留めしてください。浮動タグを使う場合は `@v0` のようなエイリアスタグを用意して運用します（任意）。

最新リリース: [v0.13.0](https://github.com/s977043/river-reviewer/releases/tag/v0.13.0)

> **ℹ️ v0.1.x からのアップグレード:** v0.2.0以降では、GitHub Actionのパスが `.github/actions/river-reviewer` から `runners/github-action` に変更されています。詳細は[移行ガイド](docs/migration/runners-architecture-guide.md)と[DEPRECATED.md](docs/deprecated.md)をご確認ください。

### 高度な設定例

- フェーズ別レビューを並列実行（上流・中流・下流を個別ジョブに分割）

```yaml
jobs:
  review-upstream:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: s977043/river-reviewer/runners/github-action@v0.13.0
        with: { phase: upstream }
        env: { OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }} }

  review-midstream:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: s977043/river-reviewer/runners/github-action@v0.13.0
        with: { phase: midstream }
        env: { OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }} }

  review-downstream:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: s977043/river-reviewer/runners/github-action@v0.13.0
        with: { phase: downstream }
        env: { OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }} }
```

- コスト見積もりと上限の例

```yaml
review:
  runs-on: ubuntu-latest
  if: "!contains(github.event.pull_request.title, '[skip-review]')" # タイトルでスキップ
  steps:
    - uses: actions/checkout@v6
      with: { fetch-depth: 0 }
    - uses: s977043/river-reviewer/runners/github-action@v0.13.0
      with:
        phase: midstream
        estimate: true # コスト見積もりのみ
        max_cost: 1.5 # USD 上限、超過で終了
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

- Draft/Ready でレビュー強度を変える例

```yaml
  review-light:
    if: github.event.pull_request.draft == true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: s977043/river-reviewer/runners/github-action@v0.13.0
        with:
          phase: midstream
          dry_run: true            # Draft はドライランでプロンプト確認のみ
          debug: true
        env: { OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }} }

  review-full:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: s977043/river-reviewer/runners/github-action@v0.13.0
        with:
          phase: midstream
          dry_run: false           # Ready ではフルレビュー
        env: { OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }} }
```

### 設定ファイルでのカスタマイズ

リポジトリ直下に `.river-reviewer.json` / `.river-reviewer.yaml` / `.river-reviewer.yml` を置くと、モデル設定・レビュー言語・厳格度・除外パターンをプロジェクト単位で上書きできます。見つからない場合は下記のデフォルト値で動作します。

```yaml
# デフォルト値の例
model:
  provider: openai
  modelName: gpt-4o-mini
  temperature: 0
  maxTokens: 600
review:
  language: ja
  severity: normal
  additionalInstructions: []
exclude:
  files: []
  prLabelsToIgnore: []
```

設定は `ConfigLoader` が Zod で検証したうえでデフォルトとマージされます。値を部分的に指定するだけで残りは自動補完されるため、JSON/YAML どちらでも最小限の記述でカスタムできます。
トップレベルはオブジェクトのみ受け付けるため、配列やスカラー値のみのファイルはエラーとなります。

### セキュリティ考慮事項

- `OPENAI_API_KEY` は必ず Repository Secrets に設定し、`env:` で参照する
- Private リポジトリでは必要な permissions（contents, pull-requests）を明示する
- `fetch-depth: 0` でマージベースを正しく取得し、誤差分を避ける

## クイックスタート（ローカル）

1. 環境: Node 22+ 推奨（CI は主に Node 22 系で運用、Unit tests は 20.x も検証）
2. 依存導入: `npm install`
3. スキル検証: `npm run skills:validate`
4. Agent Skills 検証（任意）: `npm run agent-skills:validate`
5. テスト: `npm test`
6. Planner 評価（任意）: `npm run planner:eval`
7. Review fixtures 評価（任意）: `npm run eval:fixtures`（must_include 方式）
8. ドキュメント開発（任意）: `npm run dev`（Docusaurus）

## AI エージェント運用

- ルートの `AGENTS.md` が AI コーディングエージェント向けの SSOT です。
- `AGENT_LEARNINGS.md` には、再利用できる確定済みの学びだけを追加します。
- 秘密情報、個人情報、一時的なメモはどちらにも書きません。

### Codex を project-local config で使う

Codex 用の project-local config は [`.codex/config.toml`](./.codex/config.toml) にあり、**opt-in** です。通常の Codex 利用には影響しません。このリポジトリ設定を使うときだけ、以下のいずれかで起動します。

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
CODEX_HOME="$REPO_ROOT/.codex" codex -C "$REPO_ROOT"
npm run codex:local -- "AGENTS.md を読んで、このブランチの作業計画を出して"
```

非対話で実行したい場合:

```bash
npm run codex:exec -- "review this branch"
```

運用上の前提:

- project-local config は安全寄りの既定値だけを持ち、モデル選択や web search は CLI 引数で都度上書きします。
- レビューや PR 準備の前には、少なくとも `npm run lint` と `npm test` を実行してください。
- `src/` と `docs/` は要確認パスです。変更が必要な場合は、先に明示的な許可を取ってください。

### ローカルレビュー実行（river run .）

1. インストール後に `npx river run . --dry-run`（または `npm run river -- --dry-run`）で現在の差分を対象にローカルレビューを実行（GitHub への投稿なし）
2. `--debug` を付けるとマージベース、対象ファイル一覧、プロンプトのプレビュー、トークン見積もり、diff 抜粋を標準出力へ表示
3. OpenAI の LLM を使う場合は `OPENAI_API_KEY`（または `RIVER_OPENAI_API_KEY`）を設定して `river run .` を実行。未設定時はスキルベースのヒューリスティックコメントでフォールバック
4. `--dry-run` は外部 API を呼ばず標準出力のみ。`--phase upstream|midstream|downstream` でフェーズ指定も可能（デフォルトは `RIVER_PHASE` 環境変数または `midstream`）
5. コンテキスト/依存の制御: `RIVER_AVAILABLE_CONTEXTS=diff,tests` や `RIVER_AVAILABLE_DEPENDENCIES=code_search,test_runner` を設定すると、スキル選択時に要求を満たさないものを理由付きでスキップできます（未設定の場合は依存チェックをスキップ）。
6. CLI で直接指定する場合: `--context diff,fullFile` や `--dependency code_search,test_runner` フラグで環境変数を上書きできます（逗号区切り）。
7. 依存のスタブ有効化: `RIVER_DEPENDENCY_STUBS=1` を指定すると、既知の依存（`code_search`, `test_runner`, `coverage_report`, `adr_lookup`, `repo_metadata`, `tracing`）を「利用可能」とみなしてスキップを防ぎます。実装準備中の環境でプランだけ確認したいときに使用してください。

### CLI Runnerインターフェイス（runners/cli）

新しいCLIインターフェイスにより、コアランナー機能に直接アクセスできます:

- `river review [files...]` - ファイルをレビュー（実行プラン生成とスキル選択）
- `river eval <skill>` - スキル定義の検証と評価
- `river eval --all` - すべてのスキルを評価
- `river create skill` - 新しいスキルをテンプレートから作成

詳細は [runners/cli/README.md](./runners/cli/README.md) を参照してください。

## Project-specific review rules

- リポジトリルートに `.river/rules.md` を置くと、プロジェクト固有のレビューポリシーが LLM プロンプトへ自動注入されます（`river run .` と GitHub Actions の双方で有効）
- ファイルが無い/空の場合は従来通り。読み込みエラー時のみ失敗します
- 例（.river/rules.md）:
  - Next.js App Router を前提とし、`pages/` ディレクトリは使用しない
  - React サーバーコンポーネントを優先し、クライアントコンポーネントは必要な場合のみ使う
  - ビジネスロジックは hooks ではなく service モジュールに寄せる

## Diff Optimization（差分最適化）

- River Reviewer は lockfile や Markdown、コメント・フォーマットのみの変更を自動で除外し、LLM に渡すトークン量を削減します
- 大きな差分はハンク単位で圧縮し、必要な変更周辺のみを送信してコストとノイズを低減します
- `river run . --debug` で最適化前後のトークン見積もりと削減率を確認できます

## スキルと拡張性

River Reviewer は「設定」ではなく「スキル」を追加することで成長します。`skills/` ディレクトリに新しいスキル定義ファイル（Markdown または YAML）を置くだけで、エージェントは自動的にそれを学習し、適切なフェーズで適用します。

### スキルの定義（Manifest-driven）

スキルは以下の柔軟なフォーマットで定義できます。

**1. Markdown 形式（推奨）**:
フロントマターでメタデータを、本文で具体的な指示を記述します。

```markdown
---
id: my-custom-check
name: Custom Check
phase: midstream
files: ['src/**/*.ts']
---

ここにレビューの指示を書きます。
```

`phase` は単一値/配列どちらも許容される点に注意してください。
`phase` / `files` は `trigger` コンテナ内にまとめても構いません（`trigger.phase`, `trigger.files`）。

**2. YAML 形式**:
構造化されたメタデータと指示を単一の YAML ファイルで記述します。

```yaml
metadata:
  id: security-check
  name: Security Review
  phase: [midstream, downstream] # 複数フェーズに対応
  files: ['**/*.ts', 'Dockerfile']
instruction: |
  セキュリティチェックの具体的な指示...
```

`trigger` を使う例:

```yaml
metadata:
  id: security-check
  name: Security Review
  trigger:
    phase: [midstream, downstream]
    files: ['**/*.ts', 'Dockerfile']
instruction: |
  セキュリティチェックの具体的な指示...
```

### ディレクトリ構成のベストプラクティス

`skills/` 配下は自由に構成できますが、以下の構成を推奨します。

- `skills/core/`: 標準搭載スキル
- `skills/<stream>/community/`: コミュニティ提供や特定ライブラリ向けスキル（例: `skills/midstream/community/`）
- `skills/private/`: プロジェクト固有の非公開スキル

Agent Skills 仕様のパッケージは `skills/agent-skills/` に配置し、`SKILL.md` + `references/` を基本構成とします（River Reviewer のスキーマ検証対象外）。

### LLM ベースのスキル選択（Skill Planner）

LLM を使ったスキル選択はプランナー関数を差し込むだけで利用できます。具体例は `pages/guides/skill-planner.md` のミニマム実装例を参照してください。LLM 未指定の場合は従来通り決定論的に並び替えて実行します。

Planner 統合後の全体アーキテクチャ（metadata → loader → planner → runner）は `pages/explanation/river-architecture.md` にまとめています。

Planner の出力品質を簡易評価する手順とメトリクスは `pages/guides/planner-evaluation.md` を参照してください（`npm run planner:eval` で実行）。

```markdown
---
id: rr-midstream-code-quality-sample-001
name: Sample Code Quality Pass
description: Checks common code quality and maintainability risks.
phase: midstream
applyTo:
  - 'src/**/*.ts'
tags: [style, maintainability, midstream]
severity: minor
---

- Instruction text for the reviewer goes here.
```

- サンプル: `skills/upstream/sample-architecture-review.md`, `skills/midstream/sample-code-quality.md`, `skills/downstream/sample-test-review.md`
- examples: `examples/README.md`
- スキーマ: スキルメタデータは `schemas/skill.schema.json`, レビュー出力は `schemas/output.schema.json`
- 参考: スキルスキーマの詳細は `pages/reference/skill-schema-reference.md`、Riverbed Memory の設計ドラフトは `pages/explanation/riverbed-memory.md`
- 既知の制限: `pages/reference/known-limitations.md`

## AI レビュー標準ポリシー

River Reviewer は、品質と再現性を保つための標準レビューポリシーに従って動作します。このポリシーは、評価方針・出力形式・禁止事項を定義し、建設的で具体的なフィードバックを提供します。

- **評価方針**: 差分からの意図理解、危険性の特定、影響範囲の評価
- **出力形式**: Summary（要約）、Comments（具体的指摘）、Suggestions（改善提案）
- **禁止事項**: 過度な推測、抽象的なレビュー、不適切なトーン、範囲外の指摘

詳細は [AI レビュー標準ポリシー](pages/reference/review-policy.md) を参照してください。

## ドキュメント設計

River Reviewer の技術ドキュメントは、[Diátaxis ドキュメントフレームワーク](https://diataxis.fr/) に基づいて構成しています。日本語がデフォルト言語で、英語版は `.en.md` 拡張子の別ファイルとして管理します（差分がある場合は日本語版を優先）。
公開ドキュメントの正（Single Source of Truth）は `pages/` で、`docs/` は内部資料のみに限定します。詳細は `DOCUMENTATION.md` を参照してください。

ドキュメントは次の 4 種類に分類されます。

- Tutorials（チュートリアル）: 学習志向。最初の成功体験のためのレッスン。
- Guides（ハウツーガイド）: タスク志向。特定のゴールを達成するための手順。
- Reference（リファレンス）: 仕様・API・スキーマなどの事実の一覧。
- Explanation（解説）: 背景・設計思想・なぜそうなっているかの説明。

`/docs` 配信（ソースは `pages/`）で上記 4 種をマッピングし、ファイル名で言語を表します。

- `pages/tutorials/*.md`（日本語）と `pages/tutorials/*.en.md`（英語）
- `pages/guides/*.md` と `pages/guides/*.en.md`
- `pages/reference/*.md` と `pages/reference/*.en.md`
- `pages/explanation/*.md` と `pages/explanation/*.en.md`

## ロードマップ

- 上流 → 中流 → 下流にわたるフェーズ別レビュー拡張
- ADR などの履歴を保持する Riverbed Memory（WontFix や過去指摘も含む）
- Evals / CI 連携による継続的な信頼性検証

進捗のソース・オブ・トゥルースは Milestones と Projects です（README の箇条書きは概観のみ）。

- Milestones: [river-reviewer/milestones](https://github.com/s977043/river-reviewer/milestones)
- Projects: [リポジトリの Projects ページ](https://github.com/s977043/river-reviewer/projects)

（任意）Issue に `m1-public` / `m2-dx` / `m3-smart` / `m4-community` のいずれかを付与すると、Milestone を自動で設定します（`.github/workflows/auto-milestone.yml`）。

## トラブルシューティング

詳細は `pages/guides/troubleshooting.md` を参照してください。

## コントリビューション

ガイドラインは `CONTRIBUTING.md` を参照してください。Issue や PR を歓迎します。

- レビューチェックリスト: `pages/contributing/review-checklist.md`

## ライセンス

本リポジトリは複数ライセンス（ファイル種別ごと）を採用しています。

- `LICENSE-CODE`（MIT）: コードとスクリプト
  - 例: `src/**`, `scripts/**`, `tests/**`
- `LICENSE-CONTENT`（CC BY 4.0）: ドキュメント、テキスト、メディア
  - 例: `pages/**`, `skills/**`, `assets/**`,（ルート直下の）`*.md`
- `LICENSE`（Apache-2.0）: リポジトリ構成（scaffolding）と設定（configuration）
  - 例: `.github/**`, `docusaurus.config.js`, `sidebars.js`, `package*.json`, `*.config.*`, `.*rc*`

追加するファイルのライセンス方針に迷う場合は、PR で明示して相談してください。
