import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * Opt-in: set RIVER_USAGE_TELEMETRY=1 to persist per-call AI usage to
 * artifacts/usage/<ISO date>-<runId>.jsonl. Defaults to OFF because writing
 * to disk during a review run is a side effect that should be explicit.
 */
export function isUsageTelemetryEnabled() {
  return process.env.RIVER_USAGE_TELEMETRY === '1';
}

/**
 * Generate a short random run identifier so concurrent dispatcher runs
 * (or repeated runs within the same second) do not collide on filename.
 */
export function generateRunId() {
  return randomBytes(4).toString('hex');
}

/**
 * Build the JSONL line for a single (file, skill) usage event. The shape
 * is intentionally stable so external cost-analysis tooling can rely on it
 * without depending on internal types.
 *
 * @param {object} event
 * @param {string} event.file
 * @param {string} event.skill
 * @param {{provider, model, inputTokens, outputTokens, cacheCreationInputTokens, cacheReadInputTokens}} event.usage
 * @param {string} [event.runId]
 * @param {string} [event.commit]
 */
export function buildUsageRecord(event) {
  const { file, skill, usage, runId, commit } = event;
  if (!usage) return null;
  return {
    timestamp: new Date().toISOString(),
    runId: runId ?? null,
    commit: commit ?? null,
    file,
    skill,
    provider: usage.provider,
    model: usage.model,
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    cacheCreationInputTokens: usage.cacheCreationInputTokens ?? 0,
    cacheReadInputTokens: usage.cacheReadInputTokens ?? 0,
  };
}

/**
 * Write usage events as JSONL to `<rootDir>/artifacts/usage/<date>-<runId>.jsonl`.
 * Silently no-ops when there are no events with `usage` populated, so
 * dispatchers can call this unconditionally without first filtering.
 *
 * @param {Array} events     SkillDispatcher result items (need .usage to be persisted)
 * @param {object} opts
 * @param {string} opts.rootDir  Project root (artifacts/usage is created under here)
 * @param {string} [opts.runId]
 * @param {string} [opts.commit]
 * @returns {Promise<string | null>}  Path to the written file, or null if skipped
 */
export async function persistUsageEvents(events, opts) {
  const records = (events || [])
    .map((e) =>
      buildUsageRecord({
        file: e.file,
        skill: e.skill,
        usage: e.usage,
        runId: opts.runId,
        commit: opts.commit,
      })
    )
    .filter(Boolean);

  if (records.length === 0) return null;

  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const runId = opts.runId ?? generateRunId();
  const dir = path.join(opts.rootDir, 'artifacts', 'usage');
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${date}-${runId}.jsonl`);
  const body = records.map((r) => JSON.stringify(r)).join('\n') + '\n';
  await fs.writeFile(filePath, body, 'utf8');
  return filePath;
}
