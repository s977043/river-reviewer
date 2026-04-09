import fs from 'node:fs';
import { queryMemory } from './riverbed-memory.mjs';
import { findActiveSuppressions } from './suppression.mjs';
import { shouldResurface } from './resurface.mjs';

/**
 * Run regression evaluation cases.
 * Each case tests a specific behavior: memory recall, suppression, or resurfacing.
 *
 * @param {{ casesPath: string, verbose?: boolean }} options
 * @returns {{ exitCode: number, cases: object[], summary: object }}
 */
export async function evaluateRegression({ casesPath, verbose = false }) {
  const raw = fs.readFileSync(casesPath, 'utf-8');
  const cases = JSON.parse(raw);
  const results = [];
  let pass = 0;
  let fail = 0;
  const categoryStats = {};

  for (const c of cases) {
    const cat = c.category;
    if (!categoryStats[cat]) categoryStats[cat] = { pass: 0, fail: 0 };
    let ok = false;
    let error = null;

    try {
      switch (cat) {
        case 'memory_recall':
          ok = runMemoryRecallCase(c);
          break;
        case 'suppression':
          ok = runSuppressionCase(c);
          break;
        case 'resurfacing':
          ok = runResurfacingCase(c);
          break;
        default:
          error = 'Unknown category: ' + cat;
      }
    } catch (err) {
      error = err.message;
    }

    if (ok && !error) {
      pass++;
      categoryStats[cat].pass++;
    } else {
      fail++;
      categoryStats[cat].fail++;
    }

    results.push({ name: c.name, category: cat, pass: ok && !error, error });
    if (verbose && error) console.error('  FAIL: ' + c.name + ' - ' + error);
  }

  const total = cases.length;
  const memoryRecallRate = safeRate(categoryStats.memory_recall);
  const suppressionAccuracy = safeRate(categoryStats.suppression);
  const resurfaceAccuracy = safeRate(categoryStats.resurfacing);
  const policyPassRate = total > 0 ? pass / total : 0;

  return {
    exitCode: fail > 0 ? 1 : 0,
    cases: results,
    summary: {
      total,
      pass,
      fail,
      policyPassRate,
      memoryRecallRate,
      escalationAccuracy: 1.0, // placeholder until risk-map eval cases are added
      suppressionAccuracy,
      resurfaceAccuracy,
    },
  };
}

function safeRate(stats) {
  if (!stats) return 1.0;
  const total = stats.pass + stats.fail;
  return total > 0 ? stats.pass / total : 1.0;
}

function runMemoryRecallCase(c) {
  const index = { entries: c.memoryEntries };
  const results = queryMemory(index, c.query);
  const resultIds = results.map((e) => e.id).sort();
  const expectedIds = [...c.expectedIds].sort();
  if (resultIds.length !== expectedIds.length) return false;
  return resultIds.every((id, i) => id === expectedIds[i]);
}

function runSuppressionCase(c) {
  const index = { entries: c.memoryEntries };
  const active = findActiveSuppressions(index, c.changedFiles);
  const activeIds = active.map((s) => s.id).sort();
  const expectedIds = [...c.expectedSuppressionIds].sort();
  if (activeIds.length !== expectedIds.length) return false;
  return activeIds.every((id, i) => id === expectedIds[i]);
}

function runResurfacingCase(c) {
  const result = shouldResurface(c.suppression, c.changedFiles);
  return result === c.expectedResurface;
}
