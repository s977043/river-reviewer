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

import path from 'node:path';

import { loadConfig as defaultLoadConfig } from '../config/loader.mjs';
import { resolveAllArtifacts as defaultResolveAllArtifacts } from '../config/artifact-resolver.mjs';
import { PHASES } from './planner-utils.mjs';

const VALID_PHASES = new Set(PHASES);

/** Raised for argument/config errors that map to CLI exit code 3. */
export class ReviewPlanError extends Error {
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
export async function runReviewPlan({
  cwd = process.cwd(),
  phase = 'midstream',
  planOnly = false,
  cliArtifacts = {},
  artifactsDir,
  debug = false,
  now = () => new Date().toISOString(),
  loadConfigImpl = defaultLoadConfig,
  resolveAllArtifactsImpl = defaultResolveAllArtifacts,
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

  const detectionRoot = artifactsDir ? path.resolve(cwd, artifactsDir) : cwd;

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
