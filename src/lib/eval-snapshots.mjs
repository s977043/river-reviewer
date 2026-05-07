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
 *
 * Both are pure functions on the repo state at the time of the run.
 * They do not affect pass/fail. `compare-eval-ledger.mjs` renders their
 * diff as informational, never as a regression.
 */
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

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  try {
    return yaml.load(m[1]) ?? null;
  } catch {
    return null;
  }
}
