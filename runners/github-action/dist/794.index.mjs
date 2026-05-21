export const id = 794;
export const ids = [794];
export const modules = {

/***/ 2794:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  ReviewPlanError: () => (/* binding */ ReviewPlanError),
  resolveReviewOutputFormat: () => (/* binding */ resolveReviewOutputFormat),
  runReviewExecReplay: () => (/* binding */ runReviewExecReplay),
  runReviewPlan: () => (/* binding */ runReviewPlan)
});

// EXTERNAL MODULE: external "node:path"
var external_node_path_ = __webpack_require__(6760);
// EXTERNAL MODULE: external "node:fs/promises"
var promises_ = __webpack_require__(1455);
// EXTERNAL MODULE: ./src/config/loader.mjs + 1 modules
var loader = __webpack_require__(3833);
;// CONCATENATED MODULE: ./src/config/artifact-resolver.mjs
/**
 * Artifact Input resolver — #802 Phase 2b
 *
 * Resolution order (per artifact-input-contract.md):
 *   1. CLI arg     – path passed explicitly by the caller
 *   2. config      – artifacts.<id> in river.config.*
 *   3. cwd default – well-known filename in the working directory
 *
 * Pure module: no singleton state; fs is injectable.
 * Scope: resolve path + existence check only.
 * Content reading / skill injection / CLI parsing → Phase 3.
 */




// CWD default filenames (from artifact-input-contract.md)

/** @type {Readonly<Record<string, string>>} */
const CWD_DEFAULTS = Object.freeze({
  'pbi-input': 'pbi-input.md',
  plan: 'plan.md',
  todo: 'todo.md',
  'test-cases': 'test-cases.md',
  'review-self': 'review-self.md',
  'review-external': 'review-external.md',
  diff: 'diff.patch',
  junit: 'junit.xml',
  coverage: 'coverage.xml',
  lint: 'lint.json',
  typecheck: 'typecheck.txt',
  'findings-pool': 'findings-pool.json',
});

/**
 * @typedef {'cli'|'config'|'cwd'} ArtifactSource
 * @typedef {object} ArtifactResolution
 * @property {string}              id
 * @property {string|null}         path
 * @property {ArtifactSource|null} source
 * @property {boolean}             exists
 * @property {boolean}             optional
 */

/**
 * Resolve a single artifact path using the three-tier order.
 *
 * Path base: CLI → cwd; config → configDir ?? cwd; cwd-default → cwd.
 *
 * @param {object} opts
 * @param {string} opts.id
 * @param {string|null} [opts.cliArg]
 * @param {string|{path:string,optional?:boolean}|null} [opts.configValue]
 * @param {string} [opts.configDir]
 * @param {string} [opts.cwd]
 * @param {Pick<import('node:fs/promises'),'access'>} [opts.fsImpl]
 * @returns {Promise<ArtifactResolution>}
 */
async function resolveArtifact({
  id,
  cliArg = null,
  configValue = null,
  configDir,
  cwd = process.cwd(),
  fsImpl = promises_,
}) {
  // Tier 1: CLI arg
  if (cliArg != null && cliArg !== '') {
    const resolved = external_node_path_.resolve(cwd, cliArg);
    const exists = await _fileExists(resolved, fsImpl);
    return { id, path: resolved, source: 'cli', exists, optional: false };
  }

  // Tier 2: config value
  if (configValue != null) {
    const base = configDir ?? cwd;
    const { rawPath, optional } = _normalizeConfigValue(configValue);
    if (rawPath) {
      const resolved = external_node_path_.resolve(base, rawPath);
      const exists = await _fileExists(resolved, fsImpl);
      return { id, path: resolved, source: 'config', exists, optional: optional ?? false };
    }
  }

  // Tier 3: cwd default (only if the file exists)
  const defaultName = CWD_DEFAULTS[id];
  if (defaultName) {
    const resolved = external_node_path_.resolve(cwd, defaultName);
    const exists = await _fileExists(resolved, fsImpl);
    if (exists) {
      return { id, path: resolved, source: 'cwd', exists: true, optional: true };
    }
  }

  // Not found
  return { id, path: null, source: null, exists: false, optional: true };
}

/**
 * Resolve all artifact IDs in parallel.
 *
 * The ID set is the union of the contract's known IDs (CWD_DEFAULTS) plus
 * any IDs explicitly named via cliArgs or configArtifacts. Explicitly
 * named IDs are never silently dropped — this keeps the resolver
 * consistent with the Phase 2a schema, which accepts unknown artifact
 * keys via `.catchall` so the contract can add IDs in a
 * backward-compatible minor bump. cwd-default lookup still only applies
 * to known IDs (CWD_DEFAULTS); an unknown ID resolves only if supplied
 * via CLI/config, otherwise it reports path:null/source:null.
 *
 * @param {object} [opts]
 * @param {Record<string,string>} [opts.cliArgs]
 * @param {Record<string,string|{path:string,optional?:boolean}>} [opts.configArtifacts]
 * @param {string} [opts.configDir]
 * @param {string} [opts.cwd]
 * @param {Pick<import('node:fs/promises'),'access'>} [opts.fsImpl]
 * @returns {Promise<Record<string, ArtifactResolution>>}
 */
async function resolveAllArtifacts({
  cliArgs = {},
  configArtifacts = {},
  configDir,
  cwd,
  fsImpl,
} = {}) {
  const ids = new Set([
    ...Object.keys(CWD_DEFAULTS),
    ...Object.keys(cliArgs),
    ...Object.keys(configArtifacts),
  ]);
  const entries = await Promise.all(
    [...ids].map((id) =>
      resolveArtifact({
        id,
        cliArg: cliArgs[id] ?? null,
        configValue: configArtifacts[id] ?? null,
        configDir,
        cwd,
        fsImpl,
      }).then((r) => [id, r])
    )
  );
  return Object.fromEntries(entries);
}

// Internal helpers

function _normalizeConfigValue(value) {
  if (typeof value === 'string') return { rawPath: value || null, optional: false };
  if (value && typeof value === 'object') {
    return { rawPath: value.path || null, optional: value.optional ?? false };
  }
  return { rawPath: null, optional: false };
}

async function _fileExists(filePath, fsImpl) {
  try {
    await fsImpl.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// EXTERNAL MODULE: ./src/lib/diff.mjs
var diff = __webpack_require__(4382);
// EXTERNAL MODULE: ./runners/core/review-runner.mjs + 5 modules
var review_runner = __webpack_require__(4584);
// EXTERNAL MODULE: ./src/lib/planner-utils.mjs
var planner_utils = __webpack_require__(1013);
;// CONCATENATED MODULE: ./src/lib/review-plan.mjs
/**
 * `river review plan` core — #802 Phase 3 (slices 1 + B-1)
 *
 * Scope: the public `river review plan --plan-only` entrypoint resolves
 * input artifacts (slice 1) and now also computes a deterministic skill
 * selection plan from the resolved `diff` artifact (B-1).
 *
 * Out of scope (later slices, design-gated): actual skill EXECUTION
 * (findings stay []), the LLM-backed planner modes (`--planner
 * order/prune`), `exec`/`verify`, the `--output`/`--format` contract
 * unification, the PLANGATE_REVIEW_CLI_READY flag, and a stable
 * `context.artifacts` field (deferred to a v2 schema per the versioning
 * policy embedded in review-artifact.schema.json).
 *
 * The emitted artifact conforms to schemas/review-artifact.schema.json
 * version "1". Resolved artifact paths are only attached under `debug`
 * (free-form) and only when `debug` is set, consistent with
 * cli-review-plan-spec.md.
 *
 * Skill selection reuses parseUnifiedDiff + buildExecutionPlan (the same
 * path tests/planner-dataset eval uses) with planner:undefined /
 * dryRun:true / llmEnabled:false, so no LLM call is ever made here.
 *
 * Pure-ish module: config loader, resolver, buildExecutionPlan and the
 * diff reader are injectable for tests.
 */










const VALID_PHASES = new Set(planner_utils/* PHASES */.ZG);
const VALID_PLANNER_MODES = new Set(planner_utils/* PLANNER_MODES */.Er);
const MODEL_HINTS = new Set(['cheap', 'balanced', 'high-accuracy']);

/** Raised for argument/config errors that map to CLI exit code 3. */
class ReviewPlanError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ReviewPlanError';
  }
}

/**
 * Replay a previously emitted plan as a Review Artifact (`--plan <path>`).
 *
 * Contract (#802 Phase 3 — replay foundation):
 *   - Input may be either a full Review Artifact (with `plan` and `phase`)
 *     or the bare plan object (must contain `selectedSkills`).
 *   - The source plan's `phase` is authoritative; the CLI `--phase` value
 *     is intentionally ignored to preserve determinism of the replay.
 *   - Artifact resolution and `buildExecutionPlan` are NOT re-run, so the
 *     selectedSkills/skippedSkills are echoed verbatim (subject to schema
 *     normalization). This locks the spec contract: "external plan wins".
 *   - Skill execution is out of scope here; `findings` stays `[]` and
 *     `status` is derived from the plan's selectedSkills emptiness, the
 *     same as `runReviewPlan`'s no-changes branch.
 *
 * @param {object} opts
 * @param {string} opts.planFile  Path to the plan JSON file.
 * @param {boolean} [opts.debug]  Attach replay debug info under `debug`.
 * @param {() => string} [opts.now]
 * @param {(p: string) => Promise<string>} [opts.readFileImpl]
 * @returns {Promise<object>} Review Artifact (schema version "1")
 */
async function runReviewExecReplay({
  planFile,
  debug = false,
  now = () => new Date().toISOString(),
  readFileImpl = (p) => (0,promises_.readFile)(p, 'utf8'),
} = {}) {
  if (!planFile || typeof planFile !== 'string') {
    throw new ReviewPlanError('--plan requires a file path.');
  }

  let raw;
  try {
    raw = await readFileImpl(planFile);
  } catch (err) {
    throw new ReviewPlanError(`Failed to read --plan file "${planFile}": ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new ReviewPlanError(`Failed to parse --plan JSON at "${planFile}": ${err.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ReviewPlanError(`--plan JSON at "${planFile}" must be a JSON object.`);
  }

  // Accept either a full Review Artifact (extract .plan) or a bare plan.
  // A full artifact is identified by `version: "1"` (the schema's required
  // const) plus a `plan` object; falling back to `parsed.plan` alone would
  // accept arbitrary wrappers, so require both.
  const looksLikeFullArtifact =
    parsed.version === '1' &&
    parsed.plan &&
    typeof parsed.plan === 'object' &&
    !Array.isArray(parsed.plan);
  const sourcePlan = looksLikeFullArtifact ? parsed.plan : parsed;
  const phaseFromArtifact =
    looksLikeFullArtifact && typeof parsed.phase === 'string' && VALID_PHASES.has(parsed.phase)
      ? parsed.phase
      : null;

  if (!Array.isArray(sourcePlan.selectedSkills)) {
    throw new ReviewPlanError(
      `--plan JSON at "${planFile}" must have plan.selectedSkills (array). ` +
        'Pass a Review Artifact produced by `river review plan` or its bare `plan` object.'
    );
  }

  const plannerMode =
    typeof sourcePlan.plannerMode === 'string' && VALID_PLANNER_MODES.has(sourcePlan.plannerMode)
      ? sourcePlan.plannerMode
      : 'off';

  const selectedSkills = sourcePlan.selectedSkills.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new ReviewPlanError(
        `--plan plan.selectedSkills[${index}] must be an object with an id.`
      );
    }
    if (typeof entry.id !== 'string' || entry.id.length === 0) {
      throw new ReviewPlanError(
        `--plan plan.selectedSkills[${index}].id must be a non-empty string.`
      );
    }
    const out = { id: entry.id, name: typeof entry.name === 'string' ? entry.name : entry.id };
    if (VALID_PHASES.has(entry.phase)) out.phase = entry.phase;
    if (MODEL_HINTS.has(entry.modelHint)) out.modelHint = entry.modelHint;
    return out;
  });

  const skippedRaw = Array.isArray(sourcePlan.skippedSkills) ? sourcePlan.skippedSkills : [];
  const skippedSkills = skippedRaw.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new ReviewPlanError(
        `--plan plan.skippedSkills[${index}] must be an object with id and reasons.`
      );
    }
    if (typeof entry.id !== 'string' || entry.id.length === 0) {
      throw new ReviewPlanError(
        `--plan plan.skippedSkills[${index}].id must be a non-empty string.`
      );
    }
    const reasons = Array.isArray(entry.reasons) ? entry.reasons.map(String) : [];
    return { id: entry.id, reasons };
  });

  const phase = phaseFromArtifact ?? 'midstream';

  const artifact = {
    version: '1',
    timestamp: now(),
    phase,
    status: selectedSkills.length > 0 ? 'ok' : 'no-changes',
    findings: [],
    plan: { plannerMode, selectedSkills, skippedSkills },
  };

  if (debug) {
    artifact.debug = {
      replay: {
        source: planFile,
        sourcePhase: phaseFromArtifact,
        sourceTimestamp: typeof parsed.timestamp === 'string' ? parsed.timestamp : null,
      },
    };
  }

  return artifact;
}

/**
 * Resolve the effective output format for the `river review` namespace
 * from parsed CLI args (#802 Phase 3 PR-2).
 *
 * Contract (per cli-review-plan-spec / plangate-cli-roadmap): canonical
 * is `--output <format>`; `--format` is a compat alias. The unified
 * format set is text|markdown|json. Until text/markdown rendering is
 * implemented, only `json` is honored; when neither flag is given the
 * format falls back to `json` for backward compatibility with the
 * slice-1/B-1/B-2 behavior (and the plangate-review workflow).
 *
 * @param {{output?:string, outputExplicit?:boolean, format?:string|null,
 *   formatExplicit?:boolean}} parsed
 * @returns {'json'}
 * @throws {ReviewPlanError} on an unsupported or conflicting combination
 */
function resolveReviewOutputFormat({
  output = 'text',
  outputExplicit = false,
  format = null,
  formatExplicit = false,
} = {}) {
  if (outputExplicit && formatExplicit && output !== format) {
    throw new ReviewPlanError(
      `--output "${output}" conflicts with --format "${format}". ` +
        'Pass only one, or matching values.'
    );
  }
  let effective;
  if (formatExplicit) effective = format;
  else if (outputExplicit) effective = output;
  else effective = 'json'; // backward-compatible default
  if (effective === 'json') return 'json';
  if (effective === 'text' || effective === 'markdown') {
    throw new ReviewPlanError(
      `Output format "${effective}" is not implemented yet for river review; only "json" is supported.`
    );
  }
  throw new ReviewPlanError(
    `Unsupported output format "${effective}" for river review. Expected: json (text/markdown not yet implemented).`
  );
}

/** skill objects carry their fields under `.metadata` (or inline). */
function meta(skill) {
  return skill?.metadata ?? skill ?? {};
}

/** Project a selected skill onto the schema's selectedSkills item shape. */
function toSelectedView(skill) {
  const m = meta(skill);
  const view = { id: String(m.id ?? ''), name: String(m.name ?? m.id ?? '') };
  if (VALID_PHASES.has(m.phase)) view.phase = m.phase;
  if (MODEL_HINTS.has(m.modelHint)) view.modelHint = m.modelHint;
  return view;
}

/**
 * Run `river review plan --plan-only` and return a schema-valid Review
 * Artifact (version "1").
 *
 * @param {object} opts
 * @param {string} [opts.cwd]
 * @param {string} [opts.phase]
 * @param {boolean} [opts.planOnly]
 * @param {Record<string,string>} [opts.cliArtifacts]
 * @param {string} [opts.artifactsDir]
 * @param {boolean} [opts.debug]
 * @param {boolean} [opts.executionDeferred] When true, mark the artifact as
 *   "plan-resolved, execution intentionally not performed yet" by adding
 *   `debug.executionDeferred: true`. Used by `river review exec` (no flags)
 *   until A2 wires the skill execution adapter (#802 Phase 3). Has no
 *   effect on `selectedSkills`/`skippedSkills` — the plan path is identical
 *   to `--dry-run`; this flag is the marker so consumers can distinguish
 *   "deferred" from "really did nothing".
 * @param {() => string} [opts.now] - timestamp factory (ISO 8601)
 * @param {(repoRoot: string) => Promise<object>} [opts.loadConfigImpl]
 * @param {Function} [opts.resolveAllArtifactsImpl]
 * @param {Function} [opts.buildExecutionPlanImpl]
 * @param {(p: string) => Promise<string>} [opts.readFileImpl]
 * @returns {Promise<object>} Review Artifact (schema version "1")
 */
async function runReviewPlan({
  cwd = process.cwd(),
  phase = 'midstream',
  planOnly = false,
  cliArtifacts = {},
  artifactsDir,
  debug = false,
  executionDeferred = false,
  now = () => new Date().toISOString(),
  loadConfigImpl = loader/* loadConfig */.Z9,
  resolveAllArtifactsImpl = resolveAllArtifacts,
  buildExecutionPlanImpl = review_runner/* buildExecutionPlan */.kN,
  readFileImpl = (p) => (0,promises_.readFile)(p, 'utf8'),
} = {}) {
  if (!planOnly) {
    throw new ReviewPlanError(
      'river review plan currently supports only --plan-only (Phase 3). ' +
        'Skill execution is not yet wired.'
    );
  }
  if (!VALID_PHASES.has(phase)) {
    throw new ReviewPlanError(
      `Invalid --phase "${phase}". Expected one of: upstream, midstream, downstream.`
    );
  }

  let config;
  try {
    config = await loadConfigImpl(cwd);
  } catch (err) {
    throw new ReviewPlanError(`Failed to load config: ${err.message}`);
  }

  const configArtifacts =
    config && typeof config.artifacts === 'object' && config.artifacts ? config.artifacts : {};

  const detectionRoot = artifactsDir ? external_node_path_.resolve(cwd, artifactsDir) : cwd;

  const resolved = await resolveAllArtifactsImpl({
    cliArgs: cliArtifacts,
    configArtifacts,
    cwd: detectionRoot,
  });

  const artifact = {
    version: '1',
    timestamp: now(),
    phase,
    status: 'ok',
    findings: [],
    plan: { plannerMode: 'off', selectedSkills: [], skippedSkills: [] },
  };

  const diffRes = resolved?.diff;
  if (diffRes?.exists && diffRes.path) {
    let diffText;
    try {
      diffText = await readFileImpl(diffRes.path);
    } catch (err) {
      throw new ReviewPlanError(`Failed to read diff artifact: ${err.message}`);
    }
    const changedFiles = (0,diff/* deriveChangedFiles */.dc)(diffText);

    let plan;
    try {
      plan = await buildExecutionPlanImpl({
        phase,
        changedFiles,
        diffText,
        plannerMode: 'off',
        planner: undefined,
        dryRun: true,
        llmEnabled: false,
        repoRoot: cwd,
        riskMap: undefined,
      });
    } catch (err) {
      throw new ReviewPlanError(`Failed to build execution plan: ${err.message}`);
    }

    artifact.plan.selectedSkills = (plan.selected ?? []).map(toSelectedView);
    artifact.plan.skippedSkills = (plan.skipped ?? []).map((s) => ({
      id: String(meta(s.skill).id ?? ''),
      reasons: Array.isArray(s.reasons) ? s.reasons.map(String) : [],
    }));
  } else {
    // No diff artifact resolved and no git fallback in this slice:
    // per cli-review-plan-spec.md this is a no-op review, not an error.
    artifact.status = 'no-changes';
  }

  if (debug || executionDeferred) {
    artifact.debug = artifact.debug ?? {};
    if (debug) artifact.debug.resolvedArtifacts = resolved;
    if (executionDeferred) artifact.debug.executionDeferred = true;
  }

  return artifact;
}


/***/ })

};

//# sourceMappingURL=794.index.mjs.map