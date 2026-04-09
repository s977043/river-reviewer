import fs from 'node:fs';
import { loadMemory, queryMemory } from './riverbed-memory.mjs';
import { findActiveSuppressions } from './suppression.mjs';
import { shouldResurface } from './resurface.mjs';
import { evaluateRisk } from './risk-map.mjs';

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
        case 'risk_map':
          ok = runRiskMapCase(c);
          break;
        case 'memory_fallback':
          ok = runMemoryFallbackCase(c);
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
  const escalationAccuracy = safeRate(categoryStats.risk_map);
  const memoryFallbackRate = safeRate(categoryStats.memory_fallback);
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
      escalationAccuracy,
      suppressionAccuracy,
      resurfaceAccuracy,
      memoryFallbackRate,
    },
  };
}

function safeRate(stats) {
  if (!stats) return 1.0;
  const total = stats.pass + stats.fail;
  return total > 0 ? stats.pass / total : 1.0;
}

function arraysEqualSorted(a, b) {
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
}

function runMemoryRecallCase(c) {
  const index = { entries: c.memoryEntries };
  const resultIds = queryMemory(index, c.query).map((e) => e.id);
  return arraysEqualSorted(resultIds, c.expectedIds);
}

function runSuppressionCase(c) {
  const index = { entries: c.memoryEntries };
  const activeIds = findActiveSuppressions(index, c.changedFiles).map((s) => s.id);
  return arraysEqualSorted(activeIds, c.expectedSuppressionIds);
}

function runResurfacingCase(c) {
  return shouldResurface(c.suppression, c.changedFiles) === c.expectedResurface;
}

function runRiskMapCase(c) {
  const result = evaluateRisk(c.riskMap, c.changedFiles);
  if (result.aggregateAction !== c.expectedAggregateAction) return false;
  return (
    arraysEqualSorted(result.escalatedFiles, c.expectedEscalatedFiles) &&
    arraysEqualSorted(result.humanReviewFiles, c.expectedHumanReviewFiles)
  );
}

function runMemoryFallbackCase(c) {
  if (c.memoryPath) {
    const index = loadMemory(c.memoryPath);
    return index.entries.length === c.expectedEntryCount;
  }
  const index = { entries: c.memoryEntries };
  const results = queryMemory(index, c.query ?? {});
  return results.length === c.expectedEntryCount;
}
