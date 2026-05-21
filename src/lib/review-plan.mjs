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
import { deriveChangedFiles, parseUnifiedDiff } from './diff.mjs';
import { buildExecutionPlan as defaultBuildExecutionPlan } from '../../runners/core/review-runner.mjs';
import { generateReview as defaultGenerateReview } from './review-engine.mjs';
import { PHASES, PLANNER_MODES } from './planner-utils.mjs';

const VALID_PHASES = new Set(PHASES);
const VALID_PLANNER_MODES = new Set(PLANNER_MODES);
const MODEL_HINTS = new Set(['cheap', 'balanced', 'high-accuracy']);

/** Raised for argument/config errors that map to CLI exit code 3. */
export class ReviewPlanError extends Error {
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
export async function runReviewExecReplay({
  planFile,
  debug = false,
  now = () => new Date().toISOString(),
  readFileImpl = (p) => readFile(p, 'utf8'),
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
 * @param {boolean} [opts.executionDeferred] When true, mark the artifact as
 *   "plan-resolved, execution intentionally not performed yet" by adding
 *   `debug.executionDeferred: true`. Used by `river review exec` (no flags)
 *   until A2 wires the skill execution adapter (#802 Phase 3). Has no
 *   effect on `selectedSkills`/`skippedSkills` — the plan path is identical
 *   to `--dry-run`; this flag is the marker so consumers can distinguish
 *   "deferred" from "really did nothing".
 * @param {boolean} [opts.executeReview] When true (#802 Phase 3 A2-1), the
 *   execution plan is built with `llmEnabled: true` so LLM-backed skills
 *   are selectable, and `generateReview` is invoked to populate the
 *   artifact `findings` array. Mutually exclusive with `executionDeferred`.
 * @param {() => string} [opts.now] - timestamp factory (ISO 8601)
 * @param {(repoRoot: string) => Promise<object>} [opts.loadConfigImpl]
 * @param {Function} [opts.resolveAllArtifactsImpl]
 * @param {Function} [opts.buildExecutionPlanImpl]
 * @param {Function} [opts.generateReviewImpl] Injectable for tests so the
 *   adapter wiring can be verified without calling an external LLM.
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
  executionDeferred = false,
  executeReview = false,
  now = () => new Date().toISOString(),
  loadConfigImpl = defaultLoadConfig,
  resolveAllArtifactsImpl = defaultResolveAllArtifacts,
  buildExecutionPlanImpl = defaultBuildExecutionPlan,
  generateReviewImpl = defaultGenerateReview,
  readFileImpl = (p) => readFile(p, 'utf8'),
} = {}) {
  if (executeReview && executionDeferred) {
    throw new ReviewPlanError(
      'executeReview and executionDeferred are mutually exclusive options.'
    );
  }
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
  let executionTrace = null;
  if (diffRes?.exists && diffRes.path) {
    let diffText;
    try {
      diffText = await readFileImpl(diffRes.path);
    } catch (err) {
      throw new ReviewPlanError(`Failed to read diff artifact: ${err.message}`);
    }
    const changedFiles = deriveChangedFiles(diffText);

    // The plan layer's selection rules differ by exec mode: for
    // plan-only/dry-run/deferred we restrict to heuristic skills, while
    // executeReview must allow LLM-backed skills so the planner can
    // produce a meaningful selectedSkills set for generateReview.
    let plan;
    try {
      plan = await buildExecutionPlanImpl({
        phase,
        changedFiles,
        diffText,
        plannerMode: 'off',
        planner: undefined,
        dryRun: !executeReview,
        llmEnabled: executeReview,
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

    if (executeReview) {
      const parsedDiff = parseUnifiedDiff(diffText);
      let review;
      try {
        review = await generateReviewImpl({
          diff: { diffText, files: parsedDiff.files ?? [] },
          plan: { selected: plan.selected ?? [] },
          phase,
          dryRun: false,
        });
      } catch (err) {
        throw new ReviewPlanError(`Failed to execute review skills: ${err.message}`);
      }
      const rawFindings = Array.isArray(review?.findings) ? review.findings : [];
      artifact.findings = rawFindings.map((f, i) => normalizeFindingForArtifact(f, i, phase));
      executionTrace = {
        skillsExecuted: artifact.plan.selectedSkills.length,
        findingsCount: artifact.findings.length,
        llmUsed: review?.debug?.llmUsed === true,
        llmSkipped: review?.debug?.llmSkipped ?? null,
        heuristicsUsed: review?.debug?.heuristicsUsed === true,
      };
    }
  } else {
    // No diff artifact resolved and no git fallback in this slice:
    // per cli-review-plan-spec.md this is a no-op review, not an error.
    artifact.status = 'no-changes';
  }

  if (debug || executionDeferred || executionTrace) {
    artifact.debug = artifact.debug ?? {};
    if (debug) artifact.debug.resolvedArtifacts = resolved;
    if (executionDeferred) artifact.debug.executionDeferred = true;
    if (executionTrace) artifact.debug.execution = executionTrace;
  }

  return artifact;
}

/**
 * Convert a generateReview finding to the Review Artifact schema shape
 * (#802 Phase 3 A2-1). The internal pipeline uses `lineStart`/`lineEnd`;
 * the schema requires `line`/`lineEnd`. This is the local adapter — the
 * same bridge exists in `formatJsonOutput` (src/cli.mjs) for the
 * `river run .` legacy path.
 */
function normalizeFindingForArtifact(finding, index, phase) {
  const id =
    typeof finding.id === 'string' && finding.id.length > 0 ? finding.id : `rr-${index + 1}`;
  const ruleId =
    typeof finding.ruleId === 'string' && finding.ruleId.length > 0 ? finding.ruleId : 'unknown';
  const title =
    typeof finding.title === 'string' && finding.title.length > 0
      ? finding.title
      : (finding.message ?? '').slice(0, 80) || ruleId;
  const message = typeof finding.message === 'string' ? finding.message : '';
  const severity = ['info', 'minor', 'major', 'critical'].includes(finding.severity)
    ? finding.severity
    : 'major';
  const out = {
    id,
    ruleId,
    title,
    message,
    severity,
    phase: VALID_PHASES.has(finding.phase) ? finding.phase : phase,
    file: typeof finding.file === 'string' ? finding.file : '<unknown>',
  };
  if (finding.lineStart && Number.isInteger(finding.lineStart) && finding.lineStart >= 1) {
    out.line = finding.lineStart;
  } else if (finding.line && Number.isInteger(finding.line) && finding.line >= 1) {
    out.line = finding.line;
  }
  if (
    finding.lineEnd &&
    Number.isInteger(finding.lineEnd) &&
    finding.lineEnd >= 1 &&
    finding.lineEnd !== (finding.lineStart ?? finding.line)
  ) {
    out.lineEnd = finding.lineEnd;
  }
  if (finding.confidence && ['high', 'medium', 'low'].includes(finding.confidence)) {
    out.confidence = finding.confidence;
  }
  if (finding.status && ['open', 'suppressed', 'verified'].includes(finding.status)) {
    out.status = finding.status;
  }
  if (Array.isArray(finding.evidence) && finding.evidence.length > 0) {
    out.evidence = finding.evidence;
  }
  if (typeof finding.suggestion === 'string' && finding.suggestion.length > 0) {
    out.suggestion = finding.suggestion;
  }
  return out;
}
