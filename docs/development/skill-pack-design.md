# Skill Pack 設計方針（オープンナレッジの梱包配布）

> Status: Draft（本ドキュメントは Epic 0 / Epic 4 の具体化です）
> Related: ROADMAP.md「Epic 0: Official Skill Pack」「Epic 4: Skill Authoring and Governance」、#1045

## 1. 背景と目的

River Review のポジションを「AI エージェントにチーム所有のレビュー判断を供給する OSS」として明確化します。
その実体として、オープンなレビューナレッジ（TypeScript レビュー、DDD レビューなど）を **pack として梱包済み** の状態で配布します。

導入直後のユーザーが skill を自作しなくても、pack を選ぶだけでレビューが機能する状態をゴールとします。

- 公開知（言語イディオム、設計手法、a11y などの一般基準）は公式 pack として配布する
- チーム固有知（自社ポリシー、ロールアウト基準など）だけをユーザーが書く
- pack は fixture / eval を伴う「テスト済みナレッジ」として品質を担保する

## 2. 方針（3 原則）

### 原則 1: pack は配布単位、tag は横断軸

pack・tag・phase の役割を混ぜないことが、軸の直交性を守る前提になります。

- pack = ユーザーが選択・導入する単位（例: `typescript`, `ddd`）
- tag = 横断検索の軸（例: `security`, `testing`）。pack をまたいで付与できる
- phase / category = pack 内の各 skill が個別に持つ実行フェーズの区分。pack manifest 自体は持たない

1 skill は複数 pack に属してもよい設計です。複数 pack を同時に指定した場合は、skill id で set-union して **1 skill を 1 回だけ実行** します（重複 finding・トークンの二重コストを防ぐ）。

### 原則 2: 既存機構の上位互換として導入する（非破壊）

registry.yaml の `recommendations:` は、すでに名前付き skill set として `--skill-set` から参照されています（`runners/core/skill-loader.mjs` の `resolveRecommendationSet`）。
pack はこの仕組みを置き換えるのではなく、メタデータを拡張した後継として定義します。併存に伴う仕様は次の通りです。

- skill ファイルの物理移動は行わない（path 変更なし、既存利用者に影響しない）
- pack manifest は skill を id の静的リストで参照する。存在しない id は validate でエラーにする
- `--skill-set <pack-id>` の既存 UX をそのまま pack の選択手段にする
- **解決順序**: packs を先に検索し、見つからなければ recommendations にフォールバックする
- **同名衝突の禁止**: packs と recommendations に同じ id が存在する状態は validate でエラーにする。既存の `recommendations.typescript` 等は pack 移行時に deprecated 注記を付けて削除し、衝突自体を起こさない
- 併存期間中、recommendations への新規追加は凍結する（Phase B で宣言）

注意: recommendations は「id をキーとするオブジェクト」、packs は「id フィールドを持つ配列」で形式が異なります。
このため Phase B では `runners/core/skill-loader.mjs` の resolver 拡張が必要であり、「軽微な変更」ではありません（§6 の見積もりに反映済み）。

### 原則 3: fixture-backed quality gate

「テスト済みナレッジ」が、プロンプト集との差別化点です。tier 昇格の条件として次を使います（§4）。

- pack 内の **各 skill** に good / bad fixture と golden output がある（S1 convention: 2026-05 retrospective 由来。定義の明文化は Phase B で行う）
- pack 内の各 skill に false-positive canary がある（既知の誤検出パターンの回帰防止）
- `npm run eval:fixtures` が CI で green である

ただし機械判定は **昇格の必要条件** であり、十分条件ではありません。
fixture は著者の自己採点になり得るため（トリビアルな fixture や過適合でゲーミング可能）、official への昇格には maintainer review を 1 回挟みます。

さらに、eval パイプライン自体がこの設計の単一障害点になるため、「ゲートのゲート」を設けます。
意図的に品質の低い canary pack を registry 外に常置し、それが official 判定を **通らない** ことを CI で確認します（Phase B）。

## 3. 軸定義

pack はいずれか 1 つの軸に分類します。軸をまたぐ関心は tag で表現します。
なお axis は分類メタデータであり、実行を制約するものではありません（tag による実行フィルタは Phase D 候補とします）。

| 軸             | 例                                  | 主な phase            | 特性                                          |
| -------------- | ----------------------------------- | --------------------- | --------------------------------------------- |
| 技術スタック軸 | `typescript`, `nextjs`, `laravel`   | midstream 中心        | 決定論寄りで fixture が書きやすい             |
| 設計手法軸     | `ddd`, `event-driven`, `api-design` | upstream 中心         | 文脈依存。plan / ADR アーティファクトに当てる |
| 横断関心軸     | `security`, `a11y`, `adversarial`   | 複数 phase にまたがる | 既存の recommendations と最も近い             |

設計手法軸（DDD など）は diff 単体への適用だと誤検出リスクが高いため、upstream の artifact（plan / ADR / pbi-input）と突き合わせる設計を標準とします。
この方針は artifact-input-contract を持つ River Review 固有の勝ち筋です。

ただし artifact を持たないライトユーザーへ pack が無価値・有害にならないよう、設計手法軸の pack には **degraded mode** を必須とします。

- artifact 必須の skill は、artifact 欠如時に `NO_REVIEW` で skip し「plan を渡すと精度が上がる」と案内する
- diff 単体でも安全に動く軽量 skill（例: ユビキタス言語の命名チェック）を 1〜2 個含め、空振りを防ぐ

## 4. 成熟度 tier

pack 単位の成熟度として `tier` を新規導入します。既存フィールドとの関係は次の通りです。

- skill 個別の `recommended: true/false` は従来通り skill 単位のフラグとして残す（pack tier とは独立）
- skill の `tags: [community]` は「コミュニティ提供」という出自を表し、pack の `tier: community`（成熟度）とは別概念である。混同を避けるため、pack 文脈の文章では「community tier」と必ず修飾する

| tier           | 条件                                                                  | 配布上の扱い                   |
| -------------- | --------------------------------------------------------------------- | ------------------------------ |
| `official`     | §2 原則 3 の機械条件をすべて満たし、かつ maintainer review を通過した | カタログ先頭に掲載、既定で推奨 |
| `community`    | 機械条件のうち fixture はあるが canary / eval が不完全                | opt-in 提案として掲載          |
| `experimental` | 上記未達（アイデア段階）                                              | カタログに注記付きで掲載       |

community までの判定は機械条件のみで行い、official のみ人間ゲートを 1 回挟みます。
tier の自動判定スクリプト（pack 単位で全 skill の条件充足をチェック）は Phase C で追加します。

## 5. pack manifest スキーマ案

registry.yaml に `packs:` セクションを追加します。

```yaml
packs:
  - id: typescript
    version: '0.1.0'
    name: 'TypeScript Review Pack'
    description: 'TypeScript の型安全・null 安全・型駆動設計のレビュー基準'
    axis: technology # technology | methodology | concern（単一値）
    tier: official # official | community | experimental
    sources:
      - name: 'TypeScript Handbook'
        version: 'TS 5.x'
        url: 'https://www.typescriptlang.org/docs/handbook/'
        reviewed_at: '2026-06-10'
    skills:
      - rr-midstream-typescript-strict-001
      - rr-midstream-typescript-nullcheck-001
      - rr-midstream-type-driven-design-001
```

設計上のポイントは次の通りです。

- `sources` は構造化フィールド（name / version / url / reviewed_at）とし、schema で必須化する。`reviewed_at` が一定期間（目安 6 ヶ月）を超えた pack には `skills:audit` で警告を出し、write-only metadata 化を防ぐ
- `version` は pack 単位の SemVer とする。**参照先 skill の内容が変わったら pack も patch bump を必須** とし、pack version の再現性を担保する（validate で skill 更新日時と pack 更新の整合を警告）
- `axis` は schema 上 enum の単一値として強制する
- スキーマは `schemas/pack.schema.json` として追加し、`skills:validate` に統合する（Phase B）。required は `id` / `version` / `name` / `description` / `axis` / `tier` / `skills` とする

テンプレートは `specs/templates/pack/pack.yaml` に配置します。

## 6. 実行計画

| Phase | 内容                                                                                                                                                      | 変更範囲                                         |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| A     | 本方針・軸・テンプレートの合意（本 PR）                                                                                                                   | docs / specs のみ                                |
| B     | 第 1 号 `typescript` pack + `schemas/pack.schema.json` + resolver 拡張（packs 優先・衝突エラー・複数指定の set-union）+ ゲートのゲート canary + S1 明文化 | registry.yaml / schemas / runners/core / scripts |
| C     | 第 2 号 `ddd` pack（upstream 軸の実証、degraded mode 込み）+ tier 自動判定スクリプト                                                                      | skills / registry.yaml / scripts                 |
| D     | カタログ生成（`skills:catalog` 拡張）、pages/ への公開ドキュメント、README 訴求更新、recommendations の deprecation 判断、tag 実行フィルタ検討            | scripts / pages / README                         |

Phase B は loader（`runners/core/skill-loader.mjs`）と検証スクリプトに踏み込むため軽微ではありません。
AGENTS.md の「Ask before editing」に従い、`src/` / `runners/` に触れる変更は個別 PR で承認を取ります。
Phase C の DDD pack は「plan / 設計レビューに効く」という River Review 固有の価値を示すショーケースとして位置付けます。

## 7. 非ゴール

- 既存 94 skill の物理的なディレクトリ再編（参照で束ねるため不要）
- pack の外部レジストリ / リモート配布（npm 配布は Epic 1 で別管理）
- `recommendations:` の即時廃止（互換期間を置く。新規追加凍結は Phase B、廃止判断は Phase D）
- pack 単位の suppression。suppression / feedback は従来通り **skill 単位**（pack 非依存）で管理する。pack 固有の調整が必要になった場合は skill の fork で対応する

## 8. 検証記録（2026-06-10）

本ドラフトは technical / consistency / adversarial の 3 視点並列セルフレビューを実施し、次の主要指摘を反映済みです。

- recommendations（オブジェクト）と packs（配列）の形式差により resolver 拡張が必要である点を §2 / §6 に明記（technical: blocker 相当）
- 同名 id 衝突（例: `typescript`）の解決順序と validate エラー化を §2 に追加（adversarial: high）
- 複数 pack 併用時の set-union / 重複実行防止を §2 原則 1 に追加（adversarial: high）
- tier 昇格を「機械判定 = 必要条件、official のみ maintainer review」に修正（adversarial: high）
- eval パイプラインの SPOF 対策として「ゲートのゲート」canary を §2 原則 3 と Phase B に追加（adversarial: critical）
- DDD pack の degraded mode を §3 に追加（adversarial: medium）
- `sources` の構造化と `skills:audit` 警告による形骸化防止を §5 に反映（adversarial: medium）
- tier / recommended / community タグの用語整理を §4 に追加（consistency: high）
