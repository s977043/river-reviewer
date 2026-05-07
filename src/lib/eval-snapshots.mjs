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
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const STREAMS = ['upstream', 'midstream', 'downstream'];

/**
 * Walk skills/{stream}/* and return per-stream severity counts.
 * @returns {Promise<Record<string, Record<string, number>>>}
 */
export async function getSeverityDistribution() {
  const out = {};
  for (const stream of STREAMS) {
    const streamDir = path.join(REPO_ROOT, 'skills', stream);
    out[stream] = {};
    let entries;
    try {
      entries = await fs.readdir(streamDir, { withFileTypes: true });
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      throw err;
    }
    for (const dirent of entries) {
      if (!dirent.isDirectory()) continue;
      const skillMd = path.join(streamDir, dirent.name, 'SKILL.md');
      let text;
      try {
        text = await fs.readFile(skillMd, 'utf8');
      } catch {
        continue;
      }
      const fm = parseFrontmatter(text);
      if (!fm) continue;
      const sev = fm.severity ?? 'unknown';
      out[stream][sev] = (out[stream][sev] ?? 0) + 1;
    }
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
