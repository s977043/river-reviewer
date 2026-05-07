/**
 * Snapshot metrics for the evaluation ledger.
 *
 * These are descriptive (not pass/fail) metrics that travel with each
 * `evaluate-all.mjs --append-ledger` entry so that long-running trends
 * can be observed across runs:
 *
 * - `severity`: per-stream count of skills by severity. Used to track the
 *   effect of severity rubric reclassifications over time
 *   (`docs/development/skill-severity-rubric.md`).
 * - `top1PerCase`: the planner-selected top1 skill for each
 *   planner-dataset case. Used to detect routing-ordering shifts that
 *   may not show up in coarse top1Match metric.
 * - `perSkillFp`: per-skill false-positive aggregation derived from the
 *   review-eval guard cases. Used to spot skills whose guards are
 *   failing more often than the rest, which the global
 *   `falsePositiveRate` metric averages away.
 *
 * All are pure functions on the repo state at the time of the run.
 * They do not affect pass/fail. `compare-eval-ledger.mjs` renders their
 * diff as informational, never as a regression.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import { loadAllSkillMetadata } from '../../runners/core/skill-loader.mjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Read all loadable skill metadata via the official loader and return a
 * `{stream: {severity: count}}` map. Skills filtered by the loader's
 * default `excludedTags` (e.g. `agent`) are not counted, matching the
 * planner's view of the skill set.
 *
 * @returns {Promise<Record<string, Record<string, number>>>}
 */
export async function getSeverityDistribution() {
  const out = { upstream: {}, midstream: {}, downstream: {} };
  let entries;
  try {
    entries = await loadAllSkillMetadata();
  } catch {
    return out;
  }
  for (const entry of entries) {
    const meta = entry.metadata ?? {};
    const sev = meta.severity ?? 'unknown';
    // Prefer category for stream classification; fall back to derived
    // path segment so even non-standard skills get bucketed somewhere.
    let stream = meta.category;
    if (!stream || !out[stream]) {
      const rel = path.relative(path.join(REPO_ROOT, 'skills'), entry.path);
      const top = rel.split(path.sep)[0];
      if (out[top]) stream = top;
    }
    if (!stream || !out[stream]) continue;
    out[stream][sev] = (out[stream][sev] ?? 0) + 1;
  }
  return out;
}

/**
 * Run the planner-dataset evaluator and return a `caseName → top1SkillId`
 * map. Returns `{}` if the planner-dataset cannot be evaluated.
 * @returns {Promise<Record<string, string|null>>}
 */
export async function getTop1PerCase() {
  let evaluatePlannerDataset;
  try {
    ({ evaluatePlannerDataset } = await import('./planner-dataset-eval.mjs'));
  } catch {
    return {};
  }
  try {
    const datasetDir = path.join(REPO_ROOT, 'tests', 'fixtures', 'planner-dataset');
    const result = await evaluatePlannerDataset({ datasetDir });
    const out = {};
    for (const c of result.cases ?? []) {
      const name = c.name ?? c.case?.name ?? null;
      if (!name) continue;
      out[name] = c.top1 ?? c.metrics?.top1 ?? null;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Run the review-eval fixtures and return a per-skill false-positive
 * aggregate. For every guard case (`expectNoFindings: true`) that the
 * skill participated in (via `planSkills`), count it as a "guard
 * exposure"; if the guard was violated, count it as an "fp hit".
 *
 * Output shape: `{ skillId: { guards, fps, fpRate } }` where `fpRate =
 * fps / guards` (or 0 when the skill has no guard exposure).
 *
 * Returns `{}` when the review-eval cannot be invoked (e.g. cases.json
 * missing).
 *
 * @returns {Promise<Record<string, {guards: number, fps: number, fpRate: number}>>}
 */
export async function getPerSkillFpRate() {
  const casesPath = path.join(REPO_ROOT, 'tests', 'fixtures', 'review-eval', 'cases.json');
  let casesText;
  try {
    casesText = await fs.readFile(casesPath, 'utf8');
  } catch {
    return {};
  }
  let cases;
  try {
    cases = JSON.parse(casesText);
  } catch {
    return {};
  }
  let evaluateReviewFixtures;
  try {
    ({ evaluateReviewFixtures } = await import('./review-fixtures-eval.mjs'));
  } catch {
    return {};
  }
  let result;
  try {
    result = await evaluateReviewFixtures({ casesPath, verbose: false });
  } catch {
    return {};
  }

  const acc = {};
  const ensure = (id) => {
    if (!acc[id]) acc[id] = { guards: 0, fps: 0, fpRate: 0 };
    return acc[id];
  };
  // Attribute results back by array index rather than case name —
  // names in cases.json are not guaranteed unique, so a name-keyed Map
  // would silently drop the planSkills of duplicates. evaluateReviewFixtures
  // emits cases in input order, so index alignment is reliable.
  const resultCases = result.cases ?? [];
  for (let i = 0; i < resultCases.length; i++) {
    const c = resultCases[i];
    if (!c.isGuardCase) continue;
    const skills = cases[i]?.planSkills ?? [];
    for (const sid of skills) {
      const slot = ensure(sid);
      slot.guards += 1;
      if (c.guardViolated) slot.fps += 1;
    }
  }
  for (const slot of Object.values(acc)) {
    slot.fpRate = slot.guards > 0 ? slot.fps / slot.guards : 0;
  }
  return acc;
}
