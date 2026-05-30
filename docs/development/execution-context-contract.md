# Execution Context Contract (`river review exec`)

This document fixes the contract between `runReviewPlan`, `buildExecutionPlan`, and `generateReview` on the `river review exec` path, as of v0.53.0. It exists primarily as a prerequisite for [#878 (A2-3 `--plan` replay execution)](https://github.com/s977043/river-reviewer/issues/878): Codex and Gemini both warned that A2-3 will silently re-introduce "context snapshot drift" bugs unless the `ExecutionContext` boundary is named and stable.

It is not user-facing reference. For end-user diagnosis, see [`docs/review/troubleshooting.md`](../review/troubleshooting.md).

## Scope and audience

- **In scope**: the three-stage pipeline that turns a resolved diff into a Review Artifact, the precise list of fields each stage produces or consumes, and which fields are derived vs. carried verbatim from a stored plan.
- **Out of scope**: the legacy `river run` pipeline (uses `src/lib/local-runner.mjs`, which has its own context shape), and the `river review plan` `--plan-only` flow that intentionally stops short of execution.
- **Audience**: contributors implementing A2-3 (`--plan` replay execution), A2-2 (LLM semantics), or any future field that lives on the plan/execution boundary.

## Pipeline summary

```text
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  runReviewPlan   │ -> │ buildExecution-  │ -> │ generateReview   │
│ (src/lib/review- │    │      Plan        │    │ (src/lib/review- │
│   plan.mjs)      │    │ (runners/core/   │    │   engine.mjs)    │
│                  │    │ review-runner)   │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
        │                       │                       │
        ├─ loads inputs          ├─ selects skills       ├─ executes skills
        ├─ derives availability  ├─ derives analysis     ├─ writes findings
        └─ owns forwarding       └─ returns plan         └─ returns review
```

## Stage 1: `runReviewPlan` inputs

These are the inputs `runReviewPlan` accepts from `src/cli.mjs` (or any future caller) and resolves into the execution context.

| Field                     | Source                                                                       | Default                                                                 | Notes                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `cwd`                     | `parsed.target`                                                              | `process.cwd()`                                                         | Repo root used by config / risk-map / artifact resolvers                                                                             |
| `phase`                   | `parsed.phase`                                                               | `'midstream'`                                                           | Validated against `VALID_PHASES`. **Ignored** when `--plan <path>` is passed (replay path uses the source plan's phase, see §Replay) |
| `planOnly`                | `parsed.planOnly` / dispatch                                                 | `false`                                                                 | Required for the no-execution branches                                                                                               |
| `cliArtifacts`            | `--artifact <id=path>` (parsed.cliArtifacts)                                 | `{}`                                                                    | Wins over config; passed to `resolveAllArtifactsImpl`                                                                                |
| `artifactsDir`            | `parsed.artifactsDir`                                                        | `undefined`                                                             | Detection root override                                                                                                              |
| `availableContexts`       | `--context` / `RIVER_AVAILABLE_CONTEXTS` / call site                         | `['diff']` when a diff artifact is resolved (`alwaysInclude: ['diff']`) | A2-fix-1 (#865) → forwarded to `buildExecutionPlan` via `resolveAvailableContexts`                                                   |
| `availableDependencies`   | `--dependency` / `RIVER_AVAILABLE_DEPENDENCIES` / `RIVER_DEPENDENCY_STUBS=1` | `null` (disabled sentinel; backward-compat)                             | A2-fix-2 (#869) → null preserves "no dependency-based skip" semantics                                                                |
| `executeReview`           | derived from `isExecExecute` in CLI                                          | `false`                                                                 | Activates the `generateReview` adapter. Mutually exclusive with `executionDeferred`                                                  |
| `executionDeferred`       | derived from old `isExecDeferred` (kept for backward-compat)                 | `false`                                                                 | Deprecated marker; see `docs/deprecated.md`                                                                                          |
| `debug`                   | `parsed.debug`                                                               | `false`                                                                 | Attaches `debug.resolvedArtifacts` and friends                                                                                       |
| `loadConfigImpl`          | injectable                                                                   | `loadConfig` from `src/config/loader.mjs`                               | Tests inject to skip filesystem                                                                                                      |
| `loadRiskMapImpl`         | injectable                                                                   | `loadRiskMap` from `src/lib/risk-map.mjs`                               | A2-fix-4 (#877) — returns `null` when `.river/risk-map.yaml` is missing                                                              |
| `resolveAllArtifactsImpl` | injectable                                                                   | `resolveAllArtifacts` from `src/config/artifact-resolver.mjs`           |                                                                                                                                      |
| `buildExecutionPlanImpl`  | injectable                                                                   | `buildExecutionPlan` from `runners/core/review-runner.mjs`              |                                                                                                                                      |
| `generateReviewImpl`      | injectable                                                                   | `generateReview` from `src/lib/review-engine.mjs`                       | A2-1 (#864). Skipped when `executeReview` is false                                                                                   |
| `readFileImpl`            | injectable                                                                   | `fs.readFile`                                                           | Tests use this to mock diff content                                                                                                  |

### Stage 1 transformations

```text
config              = await loadConfigImpl(cwd)
riskMap             = await loadRiskMapImpl(cwd)              // null if missing
resolved            = await resolveAllArtifactsImpl({...})    // diff path, config, cwd
diffText            = await readFileImpl(resolved.diff.path)  // only if diff resolved
parsedDiff          = parseUnifiedDiff(diffText)              // {files: [{path, hunks, ...}]}
changedFiles        = parsedDiff.files.map(f.path).filter(non-null)
effectiveContexts   = resolveAvailableContexts(input, {alwaysInclude: ['diff']})
effectiveDeps       = resolveAvailableDependencies(input)
```

## Stage 2: `buildExecutionPlan` inputs and outputs

Lives in `runners/core/review-runner.mjs`. Treat it as the **plan-time analysis** stage.

### Inputs (the ones `runReviewPlan` passes)

| Field                   | Source                                    | Notes                                                                                               |
| ----------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `phase`                 | from Stage 1                              |                                                                                                     |
| `changedFiles`          | derived from `parsedDiff.files`           | Used for skill `applyTo` matching and risk evaluation                                               |
| `diffText`              | raw diff string                           | Used for impact tag inference and prompt construction                                               |
| `plannerMode`           | `'off'` (hard-coded in current call site) | A non-`off` mode would inject the LLM planner                                                       |
| `planner`               | `undefined` (hard-coded)                  |                                                                                                     |
| `dryRun`                | `!executeReview`                          | `true` for plan-only / `--dry-run` / current A1 deferred; `false` for the execute path              |
| `llmEnabled`            | `executeReview`                           | A2-1 (#864): pair-flipped with `dryRun` so the inputContext check doesn't strip LLM-required skills |
| `repoRoot`              | `cwd`                                     | Used by `findRelatedADRs`                                                                           |
| `riskMap`               | from Stage 1 (`null` is fine)             | A2-fix-4 (#877): no longer hard-coded `undefined`                                                   |
| `availableContexts`     | from Stage 1                              | A2-fix-1 (#865)                                                                                     |
| `availableDependencies` | from Stage 1                              | A2-fix-2 (#869)                                                                                     |

### Output shape (what Stage 2 returns)

```ts
type ExecutionPlan = {
  // Skill selection
  selected: SkillObject[]; // ordered; full skill objects, not just metadata
  skipped: { skill: SkillObject; reasons: string[] }[];

  // Planner trace (only present when plannerMode !== 'off')
  plannerMode?: 'off' | 'order' | 'prune';
  plannerReasons?: { id: string; reason: string }[];
  plannerFallback?: boolean;
  plannerError?: string;

  // Derived analysis context (A2-fix-3 #871) — always present in non-dry-run plans
  impactTags?: string[];
  fileTypes?: Record<string, string>;
  relatedADRs?: ADREntry[];
  reviewMode?: 'tiny' | 'medium' | 'large';

  // Risk (A2-fix-4 #877) — only present when riskMap was non-null
  riskAssessment?: {
    fileRisks: { file: string; action: string; rule?: object }[];
    aggregateAction: 'comment_only' | 'escalate' | 'require_human_review';
    escalatedFiles: string[];
    humanReviewFiles: string[];
  };
};
```

The derived fields (`impactTags`, `fileTypes`, `relatedADRs`, `reviewMode`, `riskAssessment`) are the analysis context that A2-fix-3 and A2-fix-4 fixed forwarding for. **Treat them as the canonical answer to "what does this diff look like"** and prefer reading them off the plan over recomputing in later stages.

## Stage 3: `generateReview` inputs

Lives in `src/lib/review-engine.mjs`. Treat it as the **execution-time skill orchestration** stage. Skipped entirely when `executeReview` is false.

### Inputs `runReviewPlan` passes

| Field            | Source                                        | Notes                                                                                |
| ---------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `diff`           | `{ diffText, files: parsedDiff.files ?? [] }` | Always reflects the **current** repo state (re-read each call; not snapshotted)      |
| `plan`           | `{ selected: plan.selected ?? [] }`           | Note: only the raw `selected` skill objects, not the projected `selectedSkills` view |
| `phase`          | from Stage 1 / Stage 2                        |                                                                                      |
| `dryRun`         | `false` (literal)                             | Stage 3 is execution-only; A2-1's structural completeness                            |
| `config`         | Stage 1 `config`                              | Forwarded since A2-1 (#864)                                                          |
| `fileTypes`      | `plan.fileTypes`                              | A2-fix-3 (#871) — used by verifier's `filePhaseCoherent` check                       |
| `relatedADRs`    | `plan.relatedADRs`                            | A2-fix-3 (#871) — injected into prompt as cross-references                           |
| `reviewMode`     | `plan.reviewMode`                             | A2-fix-3 (#871) — drives the context budget preset                                   |
| `riskAssessment` | `plan.riskAssessment`                         | A2-fix-4 (#877) — drives per-file escalation hints in the prompt                     |

### Output shape (what Stage 3 returns)

```ts
type ReviewEngineResult = {
  findings: ReviewEngineFinding[]; // internal shape: uses lineStart/lineEnd, not line/lineEnd
  debug: {
    llmUsed: boolean;
    llmSkipped: string | null; // reason string when LLM was bypassed
    heuristicsUsed: boolean;
    promptTruncated?: boolean;
    promptPreview?: string;
    // ...
  };
};
```

The findings then go through `normalizeFindingForArtifact` (private to `review-plan.mjs`) to bridge `lineStart` → `line` for the Review Artifact schema.

## Replay path (`--plan <path>`)—current contract and A2-3 gap

PR #861 (B') established the replay contract: `--plan <path>` echoes the source plan as a schema-valid Review Artifact with `findings: []` and intentionally does **not** invoke Stage 2 or Stage 3.

> **Updated by PR #935 (v0.68.0):** `--plan` now invokes Stage 3 (`generateReview`) and returns a Review Artifact with real findings. The `findings: []` behavior described below applied to v0.51.x–v0.67.x only.

### What replay currently preserves (v0.53.0)

| Field            | Source                           | Notes                                                                   |
| ---------------- | -------------------------------- | ----------------------------------------------------------------------- |
| `selectedSkills` | source plan                      | Validated, normalized to schema shape                                   |
| `skippedSkills`  | source plan                      | Same                                                                    |
| `plannerMode`    | source plan or `'off'`           | Falls back to `'off'` for unknown values                                |
| `phase`          | source plan                      | CLI `--phase` is ignored to keep replay deterministic                   |
| `timestamp`      | fresh `new Date().toISOString()` | Replay artifact gets a new timestamp; debug.replay holds the source one |

### What replay currently does **not** do (the A2-3 gap)

- Does not re-resolve artifacts → no current diff
- Does not re-run `buildExecutionPlan` → no fresh `impactTags / fileTypes / relatedADRs / reviewMode / riskAssessment`
- Does not invoke `generateReview` → `findings: []` regardless of what the user wants

> **Updated by PR #935 (v0.68.0):** This gap is resolved. `--plan` now invokes `generateReview` (Stage 3) and produces real findings.

### A2-3 contract proposal (to be ratified by the A2-3 implementation PR)

When `--plan <path>` is passed **and** `executeReview` is requested, the replay path must:

1. Read the source plan's `selectedSkills` verbatim (no re-selection).
2. Decide whether to **carry-over** or **re-derive** each analysis-context field:
   - `phase`: **carry-over** (already the rule).
   - `fileTypes` / `relatedADRs` / `reviewMode`: must be carried over from the source plan's `debug` or a future schema slot; recomputing risks "context snapshot drift" because the diff may have moved on.
   - `riskAssessment`: same—carry over.
   - `diff`: **must come from the user-supplied artifact**, not the original repo state at plan-creation time. The contract has to make explicit that replay execution operates on whatever diff is resolved **now** (the alternative—snapshotting the diff into the plan—is a bigger change).
3. Compute a `debug.replay.drift` summary by comparing the carried-over context to any locally-resolvable signal (e.g. `changedFiles` from the current diff vs. `selectedSkills` originally selected for them).
4. Invoke `generateReview` once for the carried-over plan, then write `findings` and the standard `debug.execution` block.

The current schema's `plan.selectedSkills` does not carry `fileTypes` / `relatedADRs` / `reviewMode` / `riskAssessment`. **A2-3 will need a schema bump (v2) or a `debug.execution.snapshot` extension** before the carry-over rule can be implemented honestly. Treat that as the first deliverable of A2-3.

## Artifact ID vs `inputContext` naming convention

Two surfaces describe reviewer-facing inputs, and they intentionally use different cases:

| Surface                                                 | Format     | Examples                                          |
| ------------------------------------------------------- | ---------- | ------------------------------------------------- |
| Artifact ID (file lookup, CLI `--artifact <id>=<path>`) | kebab-case | `review-self`, `review-external`, `findings-pool` |
| Skill `inputContext` enum (`schemas/skill.schema.json`) | camelCase  | `reviewSelf`, `reviewExternal`, `findingsPool`    |

The pairs must stay in lockstep—adding one without the other leaves the synthesis class of skills (#911) unable to resolve their inputs at runtime. The contract is enforced by `tests/synthesis-artifact-context-sync.test.mjs`. When adding a new reviewer-facing artifact:

1. Add the kebab-case entry to `CWD_DEFAULTS` in `src/config/artifact-resolver.mjs`.
2. Add the camelCase counterpart to the `inputContext` enum in `schemas/skill.schema.json`.
3. Extend `SYNTHESIS_PAIRS` (or a follow-up pair list) in the sync test.

## Naming conventions for future fields

When adding a new forwarded field, follow this checklist:

1. **Document the field in this table** (Stage 1 / 2 / 3) before implementation.
2. **Decide the default sentinel**:
   - `undefined` when "absent is fine and means 'use the engine default'" (e.g. `fileTypes` in Stage 3).
   - `null` when "absent is meaningful and equals 'feature disabled'" (e.g. `availableDependencies`).
   - Concrete default value (e.g. `['diff']` for `availableContexts`) when omission would silently break selection.
3. **Add an injectable** (`xxxImpl`) if Stage 1 calls an external function (loader, resolver) so tests don't need filesystem.
4. **Add a regression test** in `tests/cli-review-plan.test.mjs` named after the failure mode, not the fix:
   - 良い: `"silent-skip: missing inputContext: diff"` / `"silent-skip: missing dependency: code_search"`
   - 悪い: `"A2-fix-N forwards X"` (loses meaning after the slice ships)

## References

- [#802](https://github.com/s977043/river-reviewer/issues/802) Phase 3 parent issue
- [#878](https://github.com/s977043/river-reviewer/issues/878) A2-3 tracker (this doc's primary consumer)
- [Spec: CLI review exec](../../pages/reference/cli-review-exec-spec.md)
- [Spec: Artifact Input Contract](../../pages/reference/artifact-input-contract.md)
- [Spec: Review Artifact](../../pages/reference/review-artifact.md)
- Predecessor PRs: #861 (B'), #864 (A2-1), #865 (A2-fix-1), #869 (A2-fix-2), #871 (A2-fix-3), #877 (A2-fix-4)
