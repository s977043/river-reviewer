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

import path from 'node:path';
import { readFile } from 'node:fs/promises';

import { loadConfig as defaultLoadConfig } from '../config/loader.mjs';
import { resolveAllArtifacts as defaultResolveAllArtifacts } from '../config/artifact-resolver.mjs';
import { deriveChangedFiles } from './diff.mjs';
import { buildExecutionPlan as defaultBuildExecutionPlan } from '../../runners/core/review-runner.mjs';
import { PHASES } from './planner-utils.mjs';

const VALID_PHASES = new Set(PHASES);
const MODEL_HINTS = new Set(['cheap', 'balanced', 'high-accuracy']);

/** Raised for argument/config errors that map to CLI exit code 3. */
export class ReviewPlanError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ReviewPlanError';
  }
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
export function resolveReviewOutputFormat({
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
 * @param {() => string} [opts.now] - timestamp factory (ISO 8601)
 * @param {(repoRoot: string) => Promise<object>} [opts.loadConfigImpl]
 * @param {Function} [opts.resolveAllArtifactsImpl]
 * @param {Function} [opts.buildExecutionPlanImpl]
 * @param {(p: string) => Promise<string>} [opts.readFileImpl]
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
  buildExecutionPlanImpl = defaultBuildExecutionPlan,
  readFileImpl = (p) => readFile(p, 'utf8'),
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
    const changedFiles = deriveChangedFiles(diffText);

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

  if (debug) {
    artifact.debug = { resolvedArtifacts: resolved };
  }

  return artifact;
}
