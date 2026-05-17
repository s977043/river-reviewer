export const id = 794;
export const ids = [794];
export const modules = {

/***/ 2794:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  ReviewPlanError: () => (/* binding */ ReviewPlanError),
  runReviewPlan: () => (/* binding */ runReviewPlan)
});

// EXTERNAL MODULE: external "node:path"
var external_node_path_ = __webpack_require__(6760);
// EXTERNAL MODULE: ./src/config/loader.mjs + 1 modules
var loader = __webpack_require__(3833);
// EXTERNAL MODULE: external "node:fs/promises"
var promises_ = __webpack_require__(1455);
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

;// CONCATENATED MODULE: ./src/lib/review-plan.mjs
/**
 * `river review plan` core — #802 Phase 3 (slice 1)
 *
 * Scope: wire the artifact resolver into the main CLI's public
 * `river review plan --plan-only` entrypoint and emit a schema-valid
 * Review Artifact. Skill/planner execution, `exec`/`verify`, the
 * `--output`/`--format` contract unification, and the
 * PLANGATE_REVIEW_CLI_READY workflow flag are intentionally out of scope
 * for this slice.
 *
 * The emitted artifact conforms to schemas/review-artifact.schema.json
 * version "1". Resolved artifact paths are only attached under `debug`
 * (free-form, additionalProperties:true) and only when `debug` is set —
 * consistent with cli-review-plan-spec.md. A stable `context.artifacts`
 * field is deferred to a v2 schema per the versioning policy embedded in
 * review-artifact.schema.json.
 *
 * Pure-ish module: config loader and resolver are injectable for tests.
 */






const VALID_PHASES = new Set(['upstream', 'midstream', 'downstream']);

/** Raised for argument/config errors that map to CLI exit code 3. */
class ReviewPlanError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ReviewPlanError';
  }
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
 * @param {() => string} [opts.now] - timestamp factory (ISO 8601)
 * @param {(repoRoot: string) => Promise<object>} [opts.loadConfigImpl]
 * @param {Function} [opts.resolveAllArtifactsImpl]
 * @returns {Promise<object>} Review Artifact (schema version "1")
 */
async function runReviewPlan({
  cwd = process.cwd(),
  phase = 'midstream',
  planOnly = false,
  cliArtifacts = {},
  artifactsDir,
  debug = false,
  now = () => new Date().toISOString(),
  loadConfigImpl = loader/* loadConfig */.Z9,
  resolveAllArtifactsImpl = resolveAllArtifacts,
} = {}) {
  if (!planOnly) {
    throw new ReviewPlanError(
      'river review plan currently supports only --plan-only (Phase 3 slice 1). ' +
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
    plan: {
      plannerMode: 'off',
      selectedSkills: [],
      skippedSkills: [],
    },
  };

  if (debug) {
    artifact.debug = { resolvedArtifacts: resolved };
  }

  return artifact;
}


/***/ })

};

//# sourceMappingURL=794.index.mjs.map