# Skills Catalog

River Review に同梱されているスキル一覧です。フェーズ別に分類しています。

## upstream

### `river-review-architecture`

- 名前: `river-review-architecture`
- 概要: `設計・アーキテクチャ観点のレビューエージェント。 依存関係、境界設計、データモデル、API設計等の個別スキルへルーティングする。`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,mjs}`
  - `docs/**/*design*.md`
  - `docs/adr/**/*`
  - `pages/**/*design*.md`
- 重要度: major
- タグ: architecture / design / entry / routing
- 依存関係: none
- 適用条件: phase=upstream, inputContext=diff / fullFile / adr

チェック項目の例:

- findings / questions / actions

### `rr-upstream-adr-decision-quality-001`

- 名前: `ADR Decision Quality`
- 概要: `Ensure ADRs capture context; decision; alternatives; tradeoffs; and follow-ups in a way that prevents future
drift.`
- 対象:
  - `docs/adr/**/*`
  - `adr/**/*`
  - `**/*.adr`
  - `**/*adr*.md`
- 重要度: major
- タグ: architecture / adr / decision / upstream
- 依存関係: adr_lookup / repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-api-design-001`

- 名前: `API Design Consistency`
- 概要: `Ensure API design follows RESTful naming and consistent conventions.`
- 対象:
  - `**/api/**`
  - `**/routes/**`
- 重要度: major
- タグ: api / design / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- findings / summary / actions

### `rr-upstream-api-versioning-compat-001`

- 名前: `API Versioning & Backward Compatibility`
- 概要: `Ensure API/contract changes specify versioning strategy; backward compatibility; deprecation plan; and
migration guidance.`
- 対象:
  - `docs/**/*api*.md`
  - `docs/**/*openapi*.{yml,yaml,json}`
  - `docs/**/*contract*.md`
  - `docs/**/*interface*.md`
  - `docs/adr/**/*`
  - `pages/**/*api*.md`
  - `pages/**/*contract*.md`
  - `pages/**/*interface*.md`
  - `**/*openapi*.{yml,yaml,json}`
  - `**/*api*.{yml,yaml,json}`
  - `**/*.adr`
- 重要度: major
- タグ: api / compatibility / versioning / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / fullFile / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-architecture-boundaries-001`

- 名前: `Architecture Boundaries & Dependencies`
- 概要: `Ensure architecture/design docs define clear boundaries; ownership; dependency direction; and change impact to
avoid tight coupling.`
- 対象:
  - `docs/architecture/**/*`
  - `docs/adr/**/*`
  - `docs/**/*architecture*.md`
  - `docs/**/*design*.md`
  - `pages/**/*architecture*.md`
  - `**/*.adr`
  - `**/*c4*.{md,png,svg}`
  - `**/*diagram*.{md,png,svg}`
- 重要度: major
- タグ: architecture / boundaries / dependencies / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-architecture-diagrams-001`

- 名前: `Architecture Diagrams Readiness`
- 概要: `Ensure architecture diagrams are readable; consistent with text; and clear on scope; boundaries; and data
flow.`
- 対象:
  - `docs/architecture/**/*`
  - `docs/adr/**/*`
  - `docs/**/*diagram*.md`
  - `docs/**/*c4*.md`
  - `docs/**/*sequence*.md`
  - `docs/**/*flow*.md`
  - `pages/**/*diagram*.md`
  - `pages/**/*c4*.md`
  - `pages/**/*sequence*.md`
  - `pages/**/*flow*.md`
  - `**/*diagram*.{md,png,svg}`
  - `**/*c4*.{md,png,svg}`
  - `**/*sequence*.{md,png,svg}`
  - `**/*flow*.{md,png,svg}`
- 重要度: major
- タグ: architecture / diagrams / c4 / sequence / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-architecture-risk-register-001`

- 名前: `Architecture Risks, Assumptions & Open Questions`
- 概要: `Ensure design docs explicitly capture risks; assumptions; and open questions with owners; deadlines; and
mitigation plans.`
- 対象:
  - `docs/**/*design*.md`
  - `docs/**/*architecture*.md`
  - `docs/adr/**/*`
  - `docs/architecture/**/*`
  - `pages/**/*design*.md`
  - `pages/**/*architecture*.md`
  - `**/*.adr`
- 重要度: major
- タグ: architecture / risk / assumptions / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-architecture-sample-001`

- 名前: `Sample Architecture Consistency Review`
- 概要: `Checks design/ADR docs for consistency and missing decisions.`
- 対象:
  - `docs/architecture/**/*.md`
  - `docs/adr/**/*.md`
- 重要度: minor
- タグ: sample / design / architecture / upstream
- 依存関係: adr_lookup
- 適用条件: phase=upstream, inputContext=diff

チェック項目の例:

- findings / summary / questions / actions

### `rr-upstream-architecture-traceability-001`

- 名前: `Architecture Traceability & Consistency`
- 概要: `Ensure design changes stay consistent across ADRs; diagrams; and specs; decisions are traceable; and drift is
explicitly managed.`
- 対象:
  - `docs/architecture/**/*`
  - `docs/adr/**/*`
  - `docs/**/*design*.md`
  - `docs/**/*architecture*.md`
  - `pages/**/*design*.md`
  - `pages/**/*architecture*.md`
  - `**/*.adr`
  - `**/*c4*.{md,png,svg}`
  - `**/*diagram*.{md,png,svg}`
- 重要度: major
- タグ: architecture / adr / traceability / upstream
- 依存関係: adr_lookup / repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-architecture-validation-plan-001`

- 名前: `Architecture Validation Plan Guard`
- 概要: `Detect missing validation plans (how to verify the design is correct) in design documents and ADRs.`
- 対象:
  - `docs/**/*design*.md`
  - `docs/**/*architecture*.md`
  - `docs/adr/**/*`
  - `docs/architecture/**/*`
  - `pages/**/*design*.md`
  - `pages/**/*architecture*.md`
  - `**/*.adr`
- 重要度: minor
- タグ: architecture / validation / verification / slo / upstream
- 依存関係: adr_lookup / repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- findings / actions / questions

### `rr-upstream-availability-architecture-001`

- 名前: `Availability & Resilience Architecture`
- 概要: `Ensure architecture docs capture availability targets; failover strategy; capacity headroom; and resilience
trade-offs for critical services.`
- 対象:
  - `docs/architecture/**/*`
  - `docs/adr/**/*`
  - `docs/**/*design*.md`
  - `docs/**/*availability*.md`
  - `pages/**/*design*.md`
  - `pages/**/*architecture*.md`
  - `**/*.adr`
- 重要度: major
- タグ: availability / resilience / sre / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-bounded-context-language-001`

- 名前: `Bounded Context & Ubiquitous Language`
- 概要: `Ensure architecture docs define bounded contexts; ownership; and a consistent ubiquitous language to prevent
domain drift and coupling.`
- 対象:
  - `docs/**/*design*.md`
  - `docs/**/*architecture*.md`
  - `docs/adr/**/*`
  - `docs/architecture/**/*`
  - `pages/**/*design*.md`
  - `pages/**/*architecture*.md`
  - `**/*.adr`
- 重要度: major
- タグ: architecture / domain / boundaries / language / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-cache-strategy-consistency-001`

- 名前: `Cache Strategy Consistency Guard`
- 概要: `Detect undefined or inconsistent cache strategies (layers; consistency; invalidation; TTL; failure handling)
in design documents.`
- 対象:
  - `docs/**/*.md`
  - `design/**/*.md`
  - `specs/**/*.md`
  - `rfc/**/*.md`
  - `**/*design*.md`
  - `**/*spec*.md`
  - `**/*architecture*.md`
- 重要度: minor
- タグ: cache / consistency / architecture / upstream / design-review
- 依存関係: none
- 適用条件: phase=upstream, inputContext=diff

チェック項目の例:

- findings / actions

### `rr-upstream-capacity-cost-design-001`

- 名前: `Capacity, Performance & Cost Assumptions`
- 概要: `Ensure architecture/design docs state traffic assumptions; performance budgets; resource limits; and cost
risks for critical paths.`
- 対象:
  - `docs/**/*performance*.md`
  - `docs/**/*capacity*.md`
  - `docs/**/*scal*.md`
  - `docs/**/*cost*.md`
  - `docs/**/*design*.md`
  - `pages/**/*performance*.md`
  - `pages/**/*capacity*.md`
  - `pages/**/*scal*.md`
  - `pages/**/*cost*.md`
- 重要度: major
- タグ: architecture / performance / capacity / cost / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-change-communication-001`

- 名前: `Architecture Change Communication`
- 概要: `Ensure architecture updates document affected stakeholders; notification plan; and deprecation/retirement
signals to keep knowledge aligned.`
- 対象:
  - `docs/architecture/**/*`
  - `docs/adr/**/*`
  - `docs/**/*design*.md`
  - `docs/**/*architecture*.md`
  - `pages/**/*design*.md`
  - `pages/**/*architecture*.md`
  - `**/*.adr`
- 重要度: major
- タグ: architecture / communication / governance / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / questions

### `rr-upstream-context-budget-tuning-001`

- 名前: `Context Budget Tuning`
- 概要: `.river-review.{yaml; json} の context.budget / ranking / reviewMode 設定をモデル仕様とリポジトリ規模に合わせて調整するレビュー観点。`
- 対象:
  - `.river-review.yaml`
  - `.river-review.yml`
  - `.river-review.json`
- 重要度: minor
- タグ: configuration / context / process / upstream
- 依存関係: none
- 適用条件: phase=upstream, inputContext=diff / repoConfig

チェック項目の例:

- findings / actions

### `rr-upstream-create-plan-001`

- 名前: `計画作成とレビュー`
- 概要: `課題のゴールと制約を整理し、仮説・リスク付きの実行計画を段階的に提示して人間レビューにかける`
- 対象:
  - `docs/**/*`
  - `pages/**/*`
  - `docs/adr/**/*`
  - `**/*.adr`
- 重要度: minor
- タグ: planning / upstream
- 依存関係: none
- 適用条件: phase=upstream, inputContext=diff / repoConfig

チェック項目の例:

- summary / actions / questions

### `rr-upstream-data-flow-state-ownership-001`

- 名前: `Data Flow & State Ownership`
- 概要: `Ensure designs define data flow; state ownership; consistency boundaries; and cross-boundary writes to prevent
drift and incidents.`
- 対象:
  - `docs/**/*flow*.md`
  - `docs/**/*sequence*.md`
  - `docs/**/*data-flow*.md`
  - `docs/**/*state*.md`
  - `docs/**/*design*.md`
  - `pages/**/*flow*.md`
  - `pages/**/*sequence*.md`
  - `**/*sequence*.{md,png,svg}`
  - `**/*flow*.{md,png,svg}`
  - `**/*dfd*.{md,png,svg}`
  - `**/*diagram*.{md,png,svg}`
- 重要度: major
- タグ: architecture / dataflow / state / ownership / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-data-model-db-design-001`

- 名前: `Data Model & DB Design Review`
- 概要: `Ensure data model/DB designs cover constraints; integrity; indexes; migrations; rollback; and operational
impacts.`
- 対象:
  - `**/*schema*.{sql,prisma}`
  - `**/*migrate*/**/*.{sql}`
  - `**/*migration*/**/*.{sql}`
  - `**/*ddl*.sql`
  - `**/*erd*.{md,png,svg}`
  - `docs/**/*db*.md`
  - `docs/**/*schema*.md`
- 重要度: major
- タグ: database / schema / migration / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / fullFile / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-dr-multiregion-001`

- 名前: `Disaster Recovery & Multi-Region Readiness`
- 概要: `Ensure architecture docs define RPO/RTO; failover paths; data consistency; and DR drillability.`
- 対象:
  - `docs/**/*dr*.md`
  - `docs/**/*disaster*.md`
  - `docs/**/*business-continuity*.md`
  - `docs/**/*multi-region*.md`
  - `docs/**/*resilien*.md`
  - `pages/**/*dr*.md`
  - `pages/**/*disaster*.md`
  - `pages/**/*business-continuity*.md`
  - `pages/**/*multi-region*.md`
  - `pages/**/*resilien*.md`
  - `**/*.adr`
- 重要度: major
- タグ: reliability / dr / resiliency / multiregion / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-eval-driven-skill-design-001`

- 名前: `Eval-Driven Skill Design`
- 概要: `新規 skill SKILL.md PR で `fixtures/`と`eval/` の happy-path × guard ペアが揃っているかを確認し、欠けている場合は eval cycle (#688)
に乗せる手順を案内する。`
- 対象:
  - `skills/**/SKILL.md`
- 重要度: minor
- タグ: skill-authoring / eval / process / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / repoConfig

チェック項目の例:

- findings / actions

### `rr-upstream-event-driven-semantics-001`

- 名前: `Event-Driven Semantics & Delivery Guarantees`
- 概要: `Ensure event-driven designs specify delivery guarantees; ordering; idempotency; schema evolution; and
replay/backfill strategy.`
- 対象:
  - `docs/**/*event*.md`
  - `docs/**/*message*.md`
  - `docs/**/*queue*.md`
  - `docs/**/*stream*.md`
  - `docs/**/*kafka*.md`
  - `docs/**/*pubsub*.md`
  - `pages/**/*event*.md`
  - `pages/**/*message*.md`
  - `**/*asyncapi*.{yml,yaml,json}`
  - `**/*schema*.{avsc,json}`
  - `**/*proto*.proto`
- 重要度: major
- タグ: architecture / events / messaging / reliability / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-external-dependencies-001`

- 名前: `External Dependencies & Vendor Risks`
- 概要: `Ensure designs document third-party dependencies; SLAs; quotas; failure modes; and vendor lock-in mitigation.`
- 対象:
  - `docs/**/*design*.md`
  - `docs/**/*architecture*.md`
  - `docs/**/*dependency*.md`
  - `docs/**/*integration*.md`
  - `pages/**/*design*.md`
  - `pages/**/*architecture*.md`
- 重要度: major
- タグ: architecture / dependencies / vendor / risk / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-failure-modes-observability-001`

- 名前: `Failure Modes & Observability in Design`
- 概要: `Ensure designs specify failure modes; timeouts; error contracts; and observability for critical flows.`
- 対象:
  - `**/api/**`
  - `**/routes/**`
  - `docs/**/*`
  - `pages/**/*`
- 重要度: major
- タグ: reliability / observability / api / design / upstream
- 依存関係: repo_metadata / tracing
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- findings / actions / questions / summary

### `rr-upstream-integration-contracts-001`

- 名前: `Service Integration & Contracts`
- 概要: `Ensure cross-service integration defines contracts; ownership; failure handling; versioning; and
rollout/rollback expectations.`
- 対象:
  - `docs/**/*integration*.md`
  - `docs/**/*interface*.md`
  - `docs/**/*contract*.md`
  - `docs/**/*event*.md`
  - `docs/**/*message*.md`
  - `pages/**/*integration*.md`
  - `**/*openapi*.{yml,yaml,json}`
  - `**/*asyncapi*.{yml,yaml,json}`
  - `**/*schema*.{avsc,json}`
  - `**/*proto*.proto`
- 重要度: major
- タグ: integration / contract / api / events / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / fullFile / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-migration-rollout-rollback-001`

- 名前: `Migration, Rollout & Rollback Plan`
- 概要: `Ensure design/ADR changes include a concrete migration plan; rollout strategy; rollback conditions; and
compatibility considerations.`
- 対象:
  - `docs/**/*`
  - `pages/**/*`
  - `**/*migration*.md`
  - `**/*rollout*.md`
  - `**/*rollback*.md`
  - `**/*release*.md`
  - `**/*deploy*.md`
- 重要度: major
- タグ: migration / rollout / rollback / release / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-multitenancy-isolation-001`

- 名前: `Multitenancy Isolation Guard`
- 概要: `マルチテナント前提の設計差分から、テナント分離（データ/権限/リソース/障害影響）の抜けや越境リスクを検出`
- 対象:
  - `docs/**/*`
  - `design/**/*`
  - `architecture/**/*`
  - `specs/**/*`
  - `config/**/*`
  - `infrastructure/**/*`
- 重要度: major
- タグ: multitenancy / isolation / security / architecture / upstream
- 依存関係: code_search
- 適用条件: phase=upstream, inputContext=fullFile / adr

チェック項目の例:

- findings / actions

### `rr-upstream-openapi-contract-001`

- 名前: `OpenAPI Contract Completeness`
- 概要: `Ensure OpenAPI specs define consistent request/response schemas; error model; auth; pagination; and backward
compatibility.`
- 対象:
  - `**/openapi/**/*.{yml,yaml,json}`
  - `**/*openapi*.{yml,yaml,json}`
  - `**/*swagger*.{yml,yaml,json}`
  - `**/*api*.{yml,yaml,json}`
  - `docs/**/*api*.md`
- 重要度: major
- タグ: api / openapi / contract / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / fullFile / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-operability-slo-001`

- 名前: `Operability, SLO & Runbook Readiness`
- 概要: `Ensure designs define operability basics: SLO/SLI; monitoring; alerting; on-call actions; and incident
handling expectations.`
- 対象:
  - `docs/**/*`
  - `pages/**/*`
  - `**/*slo*.md`
  - `**/*sli*.md`
  - `**/*runbook*.md`
  - `**/*operat*.md`
  - `**/*monitor*.md`
  - `**/*alert*.md`
- 重要度: major
- タグ: reliability / sre / operability / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-plangate-exec-conformance-001`

- 名前: `PlanGate Exec Conformance Guard`
- 概要: `実装差分が plan / todo / test-cases アーティファクトの方針と一致しているかを検査し、逸脱・漏れ・意図外変更を検知する`
- 対象:
  - `**/*`
- 重要度: major
- タグ: plangate / conformance / exec / plan / todo / test-cases / upstream
- 依存関係: none
- 適用条件: phase=upstream, inputContext=diff / repoConfig

チェック項目の例:

- findings / summary / questions

### `rr-upstream-plangate-gc-deterministic-001`

- 名前: `PlanGate 決定論的 GC 判定`
- 概要: `River Review の artifact / memory / log に対して、retention 設定 + hard guards + excludes から決定論的に KEEP/REMOVE を判定する GC
skill`
- 対象:
  - `.river/memory/**`
  - `artifacts/evals/**`
  - `artifacts/review-artifact*.json`
- 重要度: minor
- タグ: plangate / gc / maintenance / deterministic / upstream
- 依存関係: none
- 適用条件: phase=upstream, inputContext=repoConfig / fullFile

チェック項目の例:

- summary / findings / actions

### `rr-upstream-plangate-plan-integrity-001`

- 名前: `PlanGate 計画整合性チェック`
- 概要: `pbi-input; plan; todo; test-cases 間の整合性をチェックし、実装着手前の仕様漏れを検知する`
- 対象:
  - `**/pbi-input.md`
  - `**/plan.md`
  - `**/todo.md`
  - `**/test-cases.md`
- 重要度: major
- タグ: plangate / planning / integrity / traceability / upstream
- 依存関係: none
- 適用条件: phase=upstream, inputContext=diff / fullFile

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-plangate-rule-promotion-001`

- 名前: `PlanGate ルール昇格判定`
- 概要: `運用で発見されたレビューパターン (findings / retrospective) を分析し、新 skill への昇格候補 / 既存 skill 更新候補 / 人間判断が必要な項目に分類する`
- 対象:
  - `**/review-self.md`
  - `**/review-external.md`
  - `**/retrospective.md`
  - `**/decision-log.md`
- 重要度: info
- タグ: plangate / rule-promotion / governance / skill-registry / upstream
- 依存関係: none
- 適用条件: phase=upstream, inputContext=fullFile / repoConfig

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-plangate-verification-audit-001`

- 名前: `PlanGate 検証監査 (W チェック)`
- 概要: `既存のレビュー結果 (review-self / review-external) を再点検し、漏れ・誤検知・ハルシネーション・根拠欠落を検出する W チェック skill`
- 対象:
  - `**/review-self.md`
  - `**/review-external.md`
- 重要度: major
- タグ: plangate / verification / w-check / audit / upstream
- 依存関係: none
- 適用条件: phase=upstream, inputContext=diff / fullFile

チェック項目の例:

- summary / findings / actions / questions / review-audit

### `rr-upstream-pr-template-qa-001`

- 名前: `PRテンプレート品質チェック`
- 概要: `PRテンプレートの必須項目（日本語記載、Diátaxis、検証コマンド、チェックリスト）が明確かを確認し、抜けや誤解を生む文言を指摘する`
- 対象:
  - `.github/pull_request_template.md`
  - `.github/PULL_REQUEST_TEMPLATE.md`
- 重要度: minor
- タグ: process / documentation / upstream
- 依存関係: none
- 適用条件: phase=upstream, inputContext=diff

チェック項目の例:

- findings / summary

### `rr-upstream-pre-mortem-001`

- 名前: `Pre-mortem 失敗シナリオ分析`
- 概要: `変更が将来インシデントや技術的負債を引き起こすと仮定し、その原因と経路を逆算して設計の盲点を可視化する`
- 対象:
  - `docs/**/*design*.md`
  - `docs/**/*architecture*.md`
  - `docs/adr/**/*`
  - `pages/**/*design*.md`
  - `**/*.adr`
- 重要度: major
- タグ: adversarial / pre-mortem / risk / design / upstream / cognitive-bias
- 依存関係: repo_metadata / code_search
- 適用条件: phase=upstream, inputContext=diff / fullFile / adr / commitMessage

チェック項目の例:

- findings / questions / actions

### `rr-upstream-requirements-acceptance-001`

- 名前: `Requirements Clarity & Acceptance Criteria`
- 概要: `Ensure requirement docs define scope; terminology; acceptance criteria; edge cases; and non-functional
requirements.`
- 対象:
  - `docs/**/*`
  - `pages/**/*`
  - `**/*prd*.md`
  - `**/*requirements*.md`
  - `**/*user-story*.md`
  - `**/*spec*.md`
- 重要度: major
- タグ: requirements / product / specification / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff

チェック項目の例:

- summary / findings / actions / questions

### `rr-upstream-review-policy-standard-001`

- 名前: `Standard Review Policy for Upstream`
- 概要: `Applies standard AI review policy guidelines for upstream (design) phase reviews.`
- 対象:
  - `**/*.md`
  - `**/*.adr`
  - `**/docs/**/*`
  - `**/design/**/*`
- 重要度: info
- タグ: policy / upstream / design / architecture
- 依存関係: none
- 適用条件: phase=upstream, inputContext=diff

チェック項目の例:

- findings / summary

### `rr-upstream-security-privacy-design-001`

- 名前: `Security & Privacy Design Review`
- 概要: `Review data retention; deletion; backup residency; and cross-border data transfer.`
- 対象:
  - `docs/**/*.md`
  - `**/design/**/*`
  - `**/rfc/**/*`
  - `docs/architecture/**/*`
- 重要度: minor
- タグ: security / privacy / upstream / design / gdpr / pii
- 依存関係: code_search
- 適用条件: phase=upstream, inputContext=fullFile

チェック項目の例:

- findings / actions

### `rr-upstream-test-code-nextjs-001`

- 名前: `Component Test Scaffold (Next.js)`
- 概要: `Generate React/Next.js component test skeletons (RTL) from specifications.`
- 対象:
  - `docs/**/*.md`
  - `specs/**/*.md`
- 重要度: major
- タグ: unit-test / tdd / nextjs / react / testing-library
- 依存関係: none
- 適用条件: phase=upstream, inputContext=fullFile

チェック項目の例:

- tests

### `rr-upstream-test-code-php-laravel-001`

- 名前: `Test Scaffold (Laravel/PHPUnit)`
- 概要: `Generate PHP/Laravel (PHPUnit) test skeletons from specifications.`
- 対象:
  - `docs/**/*.md`
  - `specs/**/*.md`
- 重要度: major
- タグ: unit-test / tdd / php / laravel / phpunit
- 依存関係: none
- 適用条件: phase=upstream, inputContext=fullFile

チェック項目の例:

- tests

### `rr-upstream-test-code-react-001`

- 名前: `Component Test Scaffold (React)`
- 概要: `Generate generic React component test skeletons (RTL) from specifications.`
- 対象:
  - `docs/**/*.md`
  - `specs/**/*.md`
- 重要度: major
- タグ: unit-test / tdd / react / testing-library / vite
- 依存関係: none
- 適用条件: phase=upstream, inputContext=fullFile

チェック項目の例:

- tests

### `rr-upstream-test-code-remix-001`

- 名前: `Route/Function Test Scaffold (Remix)`
- 概要: `Generate Remix loader/action and route component test skeletons.`
- 対象:
  - `docs/**/*.md`
  - `specs/**/*.md`
- 重要度: major
- タグ: unit-test / tdd / remix / react / vitest
- 依存関係: none
- 適用条件: phase=upstream, inputContext=fullFile

チェック項目の例:

- tests

### `rr-upstream-test-code-unit-python-pytest-001`

- 名前: `Unit Test Scaffold (Python/pytest)`
- 概要: `Generate Python/pytest unit test skeletons from specifications.`
- 対象:
  - `docs/**/*.md`
  - `specs/**/*.md`
- 重要度: major
- タグ: unit-test / tdd / python
- 依存関係: none
- 適用条件: phase=upstream, inputContext=fullFile

チェック項目の例:

- tests

### `rr-upstream-test-code-unit-ts-jest-001`

- 名前: `Unit Test Scaffold (TypeScript)`
- 概要: `Generate TypeScript unit test skeletons (Jest/Vitest) from specifications.`
- 対象:
  - `docs/**/*.md`
  - `specs/**/*.md`
- 重要度: major
- タグ: unit-test / tdd / typescript / jest / vitest
- 依存関係: none
- 適用条件: phase=upstream, inputContext=fullFile

チェック項目の例:

- tests

### `rr-upstream-test-code-vue-001`

- 名前: `Component Test Scaffold (Vue.js)`
- 概要: `Generate Vue.js component test skeletons (Vue Test Utils) from specifications.`
- 対象:
  - `docs/**/*.md`
  - `specs/**/*.md`
- 重要度: major
- タグ: unit-test / tdd / vue / vitest / vue-test-utils
- 依存関係: none
- 適用条件: phase=upstream, inputContext=fullFile

チェック項目の例:

- tests

### `rr-upstream-trust-boundaries-authz-001`

- 名前: `Trust Boundaries & Authorization Architecture`
- 概要: `Ensure designs define trust boundaries; authn/authz responsibilities; and propagation of identity/claims
across services.`
- 対象:
  - `docs/**/*security*.md`
  - `docs/**/*auth*.md`
  - `docs/**/*design*.md`
  - `docs/**/*architecture*.md`
  - `docs/adr/**/*`
  - `pages/**/*security*.md`
  - `pages/**/*auth*.md`
  - `pages/**/*design*.md`
  - `pages/**/*architecture*.md`
- 重要度: critical
- タグ: architecture / security / authz / trust-boundary / upstream
- 依存関係: repo_metadata
- 適用条件: phase=upstream, inputContext=diff / adr

チェック項目の例:

- summary / findings / actions / questions

## midstream

### `adversarial-review`

- 名前: `adversarial-review`
- 概要: `認知バイアスを排除するための3つの敵対的分析手法を統合したレビュースキル。 Pre-mortem（失敗シナリオ分析）、War Game（攻撃者シミュレーション）、 Logic
Torturing（論理検証）を組み合わせ、通常のレビューでは見えない 設計の盲点・防御の穴・論理の弱点を可視化する。`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,mjs}`
  - `docs/**/*design*.md`
  - `docs/adr/**/*`
  - `pages/**/*design*.md`
- 重要度: major
- タグ: adversarial / pre-mortem / war-game / logic-torturing / cognitive-bias / entry / routing
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff / fullFile

チェック項目の例:

- findings / questions / actions

### `river-review-code`

- 名前: `river-review-code`
- 概要: `一般コード品質のレビューエージェント。デフォルトのフォールバック先。 可読性、保守性、型安全性、ロギング等の個別スキルへルーティングする。`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,mjs}`
- 重要度: minor
- タグ: code-quality / default / entry / routing
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff / fullFile

チェック項目の例:

- findings / actions

### `river-review-performance`

- 名前: `river-review-performance`
- 概要: `パフォーマンス観点のレビューエージェント。 N+1クエリ、メモリ効率、キャッシュ戦略、可観測性の観点でコード変更を評価する。`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,mjs}`
  - `**/*.sql`
- 重要度: major
- タグ: performance / optimization / entry / routing
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff / fullFile

チェック項目の例:

- findings / actions

### `river-review-security`

- 名前: `river-review-security`
- 概要: `セキュリティ観点のレビューエージェント。 基本的なセキュリティチェック、認証・認可設計、プライバシー設計の個別スキルへルーティングする。`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,mjs}`
  - `**/*.env*`
  - `**/auth/**/*`
  - `**/middleware/**/*`
- 重要度: critical
- タグ: security / entry / routing
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff / fullFile

チェック項目の例:

- findings / actions

### `rr-midstream-a11y-accessible-name-001`

- 名前: `a11y Accessible Name Basics`
- 概要: `画像・ボタン・フォーム要素に適切なアクセシブルネームがあるか確認する。`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,html}`
  - `app/**/*.{ts,tsx,js,jsx,html}`
  - `components/**/*.{ts,tsx,js,jsx,html}`
- 重要度: minor
- タグ: community / accessibility / ui / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / actions

### `rr-midstream-agent-skill-bridge-001`

- 名前: `Agent Skill Bridge Review`
- 概要: `Review changes to the Agent Skills import/export bridge for path safety; round-trip fidelity; and validation
correctness.`
- 対象:
  - `src/lib/agent-skill-bridge.mjs`
  - `tests/agent-skill-bridge.test.mjs`
  - `schemas/agent-skill-loose.schema.json`
  - `scripts/validate-agent-skills.mjs`
- 重要度: major
- タグ: bridge / skills / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / actions

### `rr-midstream-api-compatibility-001`

- 名前: `API Compatibility and Test Gap Review`
- 概要: `Detect breaking API contract changes; DTO modifications without compatibility handling; and missing tests for
changed API boundaries.`
- 対象:
  - `src/**/*.{ts,tsx,js}`
  - `app/**/*.{ts,tsx,js}`
  - `lib/**/*.{ts,tsx,js}`
  - `packages/**/*.{ts,tsx,js}`
  - `pages/api/**/*.{ts,js}`
- 重要度: major
- タグ: api / compatibility / dto / breaking-change / test-coverage / midstream
- 依存関係: code_search
- 適用条件: phase=midstream, inputContext=diff / fullFile

チェック項目の例:

- findings / actions

### `rr-midstream-code-quality-sample-001`

- 名前: `Sample Code Quality Pass`
- 概要: `Checks common code quality and maintainability risks.`
- 対象:
  - `src/**/*.ts`
  - `src/**/*.js`
  - `src/**/*.py`
- 重要度: minor
- タグ: sample / style / maintainability / midstream
- 依存関係: code_search
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / actions

### `rr-midstream-config-json-001`

- 名前: `Configuration File Review`
- 概要: `Review JSON/YAML configuration files for common issues and best practices.`
- 対象:
  - `**/*.json`
  - `**/*.yml`
  - `**/*.yaml`
- 重要度: minor
- タグ: config / json / yaml / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings

### `rr-midstream-design-system-component-reuse-001`

- 名前: `Design System Component Reuse Guard`
- 概要: `既存デザインシステムコンポーネント（Button / Input / Modal / Card 等）を再実装していないかを検出する。Figma→コード実装時に既存コンポーネントを無視した実装を防ぐ。`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx}`
  - `app/**/*.{ts,tsx,js,jsx}`
  - `components/**/*.{ts,tsx,js,jsx}`
- 重要度: major
- タグ: community / design-system / component-reuse / ui / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / actions

### `rr-midstream-design-token-enforcement-001`

- 名前: `Design Token Enforcement`
- 概要: `デザイントークンを使わずに直書きされた色・余白・フォントサイズ・角丸・シャドウを検出する。Figma Variables / Tailwind config / CSS custom properties
のルールに違反する実装を指摘する。`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,css,scss}`
  - `app/**/*.{ts,tsx,js,jsx,css,scss}`
  - `components/**/*.{ts,tsx,js,jsx,css,scss}`
- 重要度: minor
- タグ: community / design-system / tokens / ui / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / actions

### `rr-midstream-gh-address-comments-001`

- 名前: `GitHubレビューコメント対応（修正案つき）`
- 概要: `PRレビューコメントを重要度ごとに整理し、対応方針・修正案・質問をまとめて返信案を作る`
- 対象:
  - `src/**/*`
  - `lib/**/*`
  - `apps/**/*`
  - `packages/**/*`
  - `tests/**/*`
  - `docs/**/*`
  - `pages/**/*`
- 重要度: major
- タグ: review / github / midstream
- 依存関係: custom:github
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- actions / questions / summary

### `rr-midstream-hello-skill-001`

- 名前: `Hello Skill (Always-On Sample)`
- 概要: `Minimal always-on sample skill to guarantee an end-to-end review experience.`
- 対象:
  - `**/*`
- 重要度: info
- タグ: sample / hello / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / summary

### `rr-midstream-i18n-unused-key-001`

- 名前: `i18n Unused Key Review`
- 概要: `Detect i18n/locale keys that are removed from source but remain in locale files; or keys added to locale files
without source usage.`
- 対象:
  - `**/i18n/**`
  - `**/locales/**`
  - `**/messages/**`
  - `**/*.json`
- 重要度: minor
- タグ: i18n / localization / dead-code / midstream
- 依存関係: code_search
- 適用条件: phase=midstream, inputContext=diff / fullFile

チェック項目の例:

- findings

### `rr-midstream-independent-review-synthesis-001`

- 名前: `Independent Review Synthesis`
- 概要: `複数の AI / 人間レビュー結果 (review-self / review-external / findings-pool) を統合し、実在性・重大度・対応優先度・merge 可否を検証する。`
- 対象:
  - `**/*`
- 重要度: major
- タグ: community / review / synthesis / multi-agent / validation / hallucination-guard / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff / fullFile / reviewSelf / reviewExternal / findingsPool

チェック項目の例:

- findings / summary / actions

### `rr-midstream-loading-state-001`

- 名前: `Loading State Transition Review`
- 概要: `Detect missing loading/error/empty state handling that could trap users in spinners or disabled states.`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx}`
  - `app/**/*.{ts,tsx,js,jsx}`
  - `lib/**/*.{ts,tsx,js,jsx}`
  - `packages/**/*.{ts,tsx,js,jsx}`
- 重要度: major
- タグ: ux / loading-state / error-handling / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings

### `rr-midstream-logging-observability-001`

- 名前: `Logging and Observability Guard`
- 概要: `Ensure code changes keep logs/metrics/traces useful for debugging failures and regressions.`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,mjs,cjs}`
  - `app/**/*.{ts,tsx,js,jsx,mjs,cjs}`
  - `lib/**/*.{ts,tsx,js,jsx,mjs,cjs}`
  - `packages/**/*.{ts,tsx,js,jsx,mjs,cjs}`
- 重要度: minor
- タグ: observability / logging / reliability / midstream
- 依存関係: tracing / code_search
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / actions

### `rr-midstream-logic-torturing-001`

- 名前: `Logic Torturing 論理検証`
- 概要: `変更に含まれる設計判断・実装選択の論理的整合性を徹底的に検証し、確証バイアスを排除して判断精度を高める`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,mjs}`
  - `docs/**/*design*.md`
  - `docs/adr/**/*`
  - `pages/**/*design*.md`
  - `pages/**/*architecture*.md`
- 重要度: major
- タグ: adversarial / logic-torturing / decision-quality / critical-thinking / midstream / cognitive-bias
- 依存関係: code_search / repo_metadata
- 適用条件: phase=midstream, inputContext=diff / fullFile / commitMessage / adr

チェック項目の例:

- findings / questions

### `rr-midstream-modern-web-a11y-interactive-001`

- 名前: `Modern Web Accessibility for Interactive UI`
- 概要: `キーボード操作 / focus 管理 / 動的コンテンツ更新 / ARIA role など、インタラクティブ UI のアクセシビリティ観点を suggestion で提示する。`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,html,css}`
  - `app/**/*.{ts,tsx,js,jsx,html,css}`
  - `components/**/*.{ts,tsx,js,jsx,html,css}`
  - `pages/**/*.{ts,tsx,js,jsx,html,css}`
  - `styles/**/*.css`
  - `public/**/*.html`
- 重要度: minor
- タグ: community / modern-web / accessibility / a11y / ui / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / actions

### `rr-midstream-modern-web-browser-compat-001`

- 名前: `Modern Web Browser Compatibility + Baseline Awareness`
- 概要: `新しい Web API / CSS の利用追加に対し、Baseline 状態とブラウザ互換性 / progressive enhancement の有無を suggestion で示す。`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,html,css}`
  - `app/**/*.{ts,tsx,js,jsx,html,css}`
  - `components/**/*.{ts,tsx,js,jsx,html,css}`
  - `pages/**/*.{ts,tsx,js,jsx,html,css}`
  - `styles/**/*.css`
  - `public/**/*.html`
- 重要度: minor
- タグ: community / modern-web / browser-compatibility / baseline / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / actions

### `rr-midstream-modern-web-performance-001`

- 名前: `Modern Web Performance + Core Web Vitals`
- 概要: `画像・スクリプト・スタイル・interaction 変更が LCP / INP / CLS / リソースコストに与える影響を suggestion で提示する。`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,html,css}`
  - `app/**/*.{ts,tsx,js,jsx,html,css}`
  - `components/**/*.{ts,tsx,js,jsx,html,css}`
  - `pages/**/*.{ts,tsx,js,jsx,html,css}`
  - `styles/**/*.css`
  - `public/**/*.html`
- 重要度: minor
- タグ: community / modern-web / performance / core-web-vitals / ui / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / actions

### `rr-midstream-modern-web-semantic-001`

- 名前: `Modern Web Semantic + Platform-Native`
- 概要: `legacy workaround を避け、semantic HTML / Web Platform Native API / modern CSS の利用機会を提示する。`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,html,css}`
  - `app/**/*.{ts,tsx,js,jsx,html,css}`
  - `components/**/*.{ts,tsx,js,jsx,html,css}`
  - `pages/**/*.{ts,tsx,js,jsx,html,css}`
  - `styles/**/*.css`
  - `public/**/*.html`
- 重要度: minor
- タグ: community / modern-web / semantic-html / accessibility / ui / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / actions

### `rr-midstream-nextjs-app-router-boundary-001`

- 名前: `Next.js App Router Client/Server Boundary`
- 概要: `App Router の Server Component でクライアント専用APIを使っていないか確認する。`
- 対象:
  - `app/**/*.{ts,tsx,js,jsx}`
  - `components/**/*.{ts,tsx,js,jsx}`
- 重要度: major
- タグ: community / nextjs / midstream / react
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / actions

### `rr-midstream-normalization-consistency-001`

- 名前: `Normalization Consistency Review`
- 概要: `Detect inconsistencies in ID formatting; date/time display; monetary amounts; and enum/status labels compared
to existing patterns in the codebase.`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx}`
  - `app/**/*.{ts,tsx,js,jsx}`
  - `lib/**/*.{ts,tsx,js,jsx}`
  - `packages/**/*.{ts,tsx,js,jsx}`
- 重要度: minor
- タグ: consistency / normalization / formatting / midstream
- 依存関係: code_search
- 適用条件: phase=midstream, inputContext=diff / fullFile

チェック項目の例:

- findings

### `rr-midstream-nullability-contract-001`

- 名前: `Nullability Contract Review`
- 概要: `Detect null/undefined/empty handling gaps where callers or consumers may receive unexpected nullish values.`
- 対象:
  - `src/**/*.{ts,tsx}`
  - `app/**/*.{ts,tsx}`
  - `lib/**/*.{ts,tsx}`
  - `packages/**/*.{ts,tsx}`
- 重要度: major
- タグ: nullability / contract / type-safety / defensive-programming / midstream
- 依存関係: code_search
- 適用条件: phase=midstream, inputContext=diff / fullFile

チェック項目の例:

- findings / actions

### `rr-midstream-review-automation-boundary-001`

- 名前: `Review Automation Boundary Guard`
- 概要: `Detect review findings that belong in CI/lint/formatter rather than human review.`
- 対象:
  - `**/*`
- 重要度: minor
- タグ: review-process / automation / ci / meta-review / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / actions / metrics

### `rr-midstream-review-comment-triage-001`

- 名前: `Review Comment Triage (No-Code-Fix Mode)`
- 概要: `レビューコメントの重要度ラベリングと対応方針・返信案を整理する。AI はコード修正やパッチ提案を行わない。`
- 対象:
  - `**/*`
- 重要度: minor
- タグ: review / process / midstream
- 依存関係: none
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / summary / questions

### `rr-midstream-review-policy-standard-001`

- 名前: `Standard Review Policy for Midstream`
- 概要: `Applies standard AI review policy guidelines for midstream (implementation) phase reviews.`
- 対象:
  - `src/**/*.ts`
  - `src/**/*.js`
  - `src/**/*.py`
  - `src/**/*.go`
  - `src/**/*.java`
  - `src/**/*.rb`
  - `lib/**/*`
  - `app/**/*`
- 重要度: info
- タグ: policy / midstream / implementation / code-quality
- 依存関係: code_search
- 適用条件: phase=midstream, inputContext=diff / fullFile

チェック項目の例:

- findings / summary / actions

### `rr-midstream-security-basic-001`

- 名前: `Baseline Security Checks`
- 概要: `Check common security risks in application code (SQLi; XSS; secrets).`
- 対象:
  - `**/{api,routes,db,ui,components,auth,security,config}/**/*.{ts,tsx,js,jsx}`
- 重要度: major
- タグ: security / midstream / web
- 依存関係: code_search
- 適用条件: phase=midstream, inputContext=diff

チェック項目の例:

- findings / actions

### `rr-midstream-suppression-feedback-001`

- 名前: `Suppression Feedback Workflow`
- 概要: `Riverbed Memory の suppression entry を活用するときの判断基準と CLI 操作を案内する。`
- 対象:
  - `src/**/*.{ts,tsx,js,jsx,mjs,cjs}`
  - `app/**/*.{ts,tsx,js,jsx,mjs}`
  - `lib/**/*.{ts,tsx,js,jsx,mjs,cjs}`
  - `packages/**/*.{ts,tsx,js,jsx,mjs,cjs}`
- 重要度: minor
- タグ: suppression / process / midstream / riverbed-memory
- 依存関係: code_search
- 適用条件: phase=midstream, inputContext=diff / commitMessage

チェック項目の例:

- findings / actions

### `rr-midstream-type-driven-design-001`

- 名前: `Type-Driven Design Guard`
- 概要: `Detect primitive obsession and missing domain/brand types; check that state is modeled via discriminated
unions.`
- 対象:
  - `src/**/*.{ts,tsx}`
  - `app/**/*.{ts,tsx}`
  - `lib/**/*.{ts,tsx}`
  - `packages/**/*.{ts,tsx}`
- 重要度: major
- タグ: typescript / type-driven-design / domain-modeling / midstream
- 依存関係: code_search
- 適用条件: phase=midstream, inputContext=diff / fullFile

チェック項目の例:

- findings / actions

### `rr-midstream-typescript-nullcheck-001`

- 名前: `TypeScript Null Safety Guardrails`
- 概要: `Enforce null/undefined safety for changed TypeScript code and suggest safer patterns.`
- 対象:
  - `src/**/*.{ts,tsx}`
  - `app/**/*.{ts,tsx}`
  - `lib/**/*.{ts,tsx}`
  - `packages/**/*.{ts,tsx}`
- 重要度: major
- タグ: typescript / type-safety / midstream
- 依存関係: code_search
- 適用条件: phase=midstream, inputContext=diff / fullFile

チェック項目の例:

- findings / actions

### `rr-midstream-typescript-strict-001`

- 名前: `TypeScript Strictness Guard`
- 概要: `Enforce TypeScript strictness by reducing any/unsafe assertions and ensuring null handling.`
- 対象:
  - `src/**/*.{ts,tsx}`
  - `app/**/*.{ts,tsx}`
  - `lib/**/*.{ts,tsx}`
  - `packages/**/*.{ts,tsx}`
- 重要度: major
- タグ: typescript / type-safety / midstream
- 依存関係: code_search
- 適用条件: phase=midstream, inputContext=diff / fullFile

チェック項目の例:

- findings / actions

### `rr-midstream-war-game-001`

- 名前: `War Game 敵対的シミュレーション`
- 概要: `攻撃者・競合・悪意あるユーザーの視点で変更を分析し、防御の盲点と悪用シナリオを可視化する`
- 対象:
  - `**/{api,routes,db,auth,security,config,middleware,handlers}/**/*.{ts,tsx,js,jsx,mjs}`
  - `**/migrations/**/*`
  - `**/*.env.example`
  - `**/config/**/*.{yaml,yml,json}`
- 重要度: major
- タグ: adversarial / war-game / security / attack-simulation / midstream / cognitive-bias
- 依存関係: code_search
- 適用条件: phase=midstream, inputContext=diff / fullFile

チェック項目の例:

- findings / actions

## downstream

### `river-review-testing`

- 名前: `river-review-testing`
- 概要: `テスト観点のレビューエージェント。 テスト網羅性、命名規則、フレーキーテスト、カバレッジギャップの個別スキルへルーティングする。`
- 対象:
  - `**/*.test.{ts,tsx,js,jsx}`
  - `**/*.spec.{ts,tsx,js,jsx}`
  - `tests/**/*`
  - `test/**/*`
  - `__tests__/**/*`
- 重要度: minor
- タグ: testing / coverage / entry / routing
- 依存関係: none
- 適用条件: phase=downstream, inputContext=diff / fullFile / tests

チェック項目の例:

- findings / actions

### `rr-downstream-coverage-gap-001`

- 名前: `Coverage and Failure Path Gaps`
- 概要: `Find missing tests for critical paths; edge cases; and failure handling in changed code.`
- 対象:
  - `src/**/*`
  - `lib/**/*`
  - `**/*.test.*`
  - `**/*.spec.*`
- 重要度: major
- タグ: tests / coverage / reliability / downstream
- 依存関係: test_runner / coverage_report
- 適用条件: phase=downstream, inputContext=diff / tests

チェック項目の例:

- tests / findings / actions / summary

### `rr-downstream-flaky-test-001`

- 名前: `Flaky Test Risk Check`
- 概要: `Detects patterns that make tests flaky and proposes stabilization steps.`
- 対象:
  - `**/*.test.ts`
  - `**/*.test.js`
  - `**/*.spec.ts`
  - `**/*.spec.js`
  - `tests/**/*.ts`
  - `tests/**/*.js`
- 重要度: major
- タグ: tests / reliability / flakiness / downstream
- 依存関係: test_runner
- 適用条件: phase=downstream, inputContext=diff

チェック項目の例:

- findings / actions / summary

### `rr-downstream-review-policy-standard-001`

- 名前: `Standard Review Policy for Downstream`
- 概要: `Applies standard AI review policy guidelines for downstream (test/QA) phase reviews.`
- 対象:
  - `test/**/*`
  - `tests/**/*`
  - `**/*.test.ts`
  - `**/*.test.js`
  - `**/*.test.py`
  - `**/*.spec.ts`
  - `**/*.spec.js`
  - `**/__tests__/**/*`
- 重要度: info
- タグ: policy / downstream / testing / qa
- 依存関係: test_runner / coverage_report / code_search
- 適用条件: phase=downstream, inputContext=diff / tests

チェック項目の例:

- findings / summary / tests

### `rr-downstream-test-existence-001`

- 名前: `Test Presence for Changed Code`
- 概要: `Check whether changed code paths have corresponding tests and suggest minimal coverage.`
- 対象:
  - `src/**/*`
  - `lib/**/*`
  - `**/*.test.*`
  - `**/*.spec.*`
- 重要度: major
- タグ: tests / coverage / downstream
- 依存関係: test_runner / coverage_report
- 適用条件: phase=downstream, inputContext=diff / tests

チェック項目の例:

- tests / findings / actions

### `rr-downstream-test-naming-001`

- 名前: `Test Naming and Structure`
- 概要: `Ensure tests use clear naming and cover edge cases with proper describe/it structure.`
- 対象:
  - `**/*.test.ts`
  - `**/*.spec.ts`
- 重要度: minor
- タグ: tests / naming / downstream
- 依存関係: none
- 適用条件: phase=downstream, inputContext=tests / diff

チェック項目の例:

- tests / findings / summary

### `rr-downstream-test-plan-review-001`

- 名前: `テスト観点レビュー（差分ドリブン）`
- 概要: `変更差分から重要なテスト観点と欠落を洗い出し、優先度付きでテストケース案を提示する`
- 対象:
  - `src/**/*`
  - `lib/**/*`
  - `tests/**/*`
  - `**/*.test.*`
  - `**/*.spec.*`
- 重要度: major
- タグ: tests / coverage / downstream
- 依存関係: test_runner / code_search
- 適用条件: phase=downstream, inputContext=diff / tests

チェック項目の例:

- tests / findings / questions / actions

### `rr-downstream-test-review-sample-001`

- 名前: `Sample Test Coverage Review`
- 概要: `Evaluates downstream tests for coverage and edge cases.`
- 対象:
  - `tests/**/*.ts`
  - `tests/**/*.js`
  - `tests/**/*.py`
- 重要度: major
- タグ: sample / tests / coverage / downstream
- 依存関係: test_runner / coverage_report / code_search
- 適用条件: phase=downstream, inputContext=diff / tests

チェック項目の例:

- tests / findings / summary / actions
