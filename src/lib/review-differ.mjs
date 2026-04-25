import { computeFindingBreakdown } from './scoring/breakdown.mjs';
import { annotateFingerprints } from './finding-fingerprint.mjs';

/**
 * @typedef {'new'|'resolved'|'persisting'|'score_changed'} FindingStatus
 *
 * @typedef {object} ComparedFinding
 * @property {string} fingerprint
 * @property {FindingStatus} changeStatus
 * @property {object} current  — null when resolved
 * @property {object} previous — null when new
 * @property {number|null} scoreDelta — composite score change (current - previous), null when new/resolved
 */

/**
 * Compare two ordered lists of findings (previous run vs current run).
 *
 * @param {object[]} previousFindings
 * @param {object[]} currentFindings
 * @returns {{ new: ComparedFinding[], resolved: ComparedFinding[], persisting: ComparedFinding[], scoreChanged: ComparedFinding[], summary: object }}
 */
export function diffReviews(previousFindings, currentFindings) {
  const prev = annotateFingerprints(previousFindings ?? []);
  const curr = annotateFingerprints(currentFindings ?? []);

  const prevByFp = new Map(prev.map((f) => [f.fingerprint, f]));
  const currByFp = new Map(curr.map((f) => [f.fingerprint, f]));

  const newFindings = [];
  const resolvedFindings = [];
  const persistingFindings = [];
  const scoreChangedFindings = [];

  // New: in current but not in previous
  for (const [fp, f] of currByFp) {
    if (!prevByFp.has(fp)) {
      newFindings.push({ fingerprint: fp, changeStatus: 'new', current: f, previous: null, scoreDelta: null });
    }
  }

  // Resolved: in previous but not in current
  for (const [fp, f] of prevByFp) {
    if (!currByFp.has(fp)) {
      resolvedFindings.push({ fingerprint: fp, changeStatus: 'resolved', current: null, previous: f, scoreDelta: null });
    }
  }

  // Persisting (and possibly score_changed): in both
  for (const [fp, currF] of currByFp) {
    const prevF = prevByFp.get(fp);
    if (!prevF) continue;

    const prevScore = computeFindingBreakdown(prevF).composite;
    const currScore = computeFindingBreakdown(currF).composite;
    const delta = currScore - prevScore;
    const changed = Math.abs(delta) >= 0.05;

    if (changed) {
      scoreChangedFindings.push({ fingerprint: fp, changeStatus: 'score_changed', current: currF, previous: prevF, scoreDelta: delta });
    } else {
      persistingFindings.push({ fingerprint: fp, changeStatus: 'persisting', current: currF, previous: prevF, scoreDelta: delta });
    }
  }

  const summary = {
    totalPrevious: prev.length,
    totalCurrent: curr.length,
    newCount: newFindings.length,
    resolvedCount: resolvedFindings.length,
    persistingCount: persistingFindings.length,
    scoreChangedCount: scoreChangedFindings.length,
    regressionScore: newFindings.length - resolvedFindings.length,
  };

  return {
    new: newFindings,
    resolved: resolvedFindings,
    persisting: persistingFindings,
    scoreChanged: scoreChangedFindings,
    summary,
  };
}

/**
 * Format a regression diff as a Markdown summary block.
 */
export function formatRegressionSummary(diff) {
  const { summary, new: newF, resolved, scoreChanged } = diff;
  const lines = ['## Regression Review Summary', ''];

  lines.push(`| Metric | Count |`);
  lines.push(`|---|---|`);
  lines.push(`| New findings | ${summary.newCount} |`);
  lines.push(`| Resolved findings | ${summary.resolvedCount} |`);
  lines.push(`| Persisting | ${summary.persistingCount} |`);
  lines.push(`| Score changed | ${summary.scoreChangedCount} |`);
  lines.push(`| Regression score | ${summary.regressionScore > 0 ? `+${summary.regressionScore}` : summary.regressionScore} |`);
  lines.push('');

  if (newF.length) {
    lines.push('### New findings');
    for (const f of newF) {
      const sev = f.current.severity ?? 'unknown';
      const file = f.current.file ?? '?';
      lines.push(`- **[${sev}]** \`${file}\`: ${(f.current.title || f.current.message || '').slice(0, 80)}`);
    }
    lines.push('');
  }

  if (resolved.length) {
    lines.push('### Resolved findings');
    for (const f of resolved) {
      const sev = f.previous.severity ?? 'unknown';
      const file = f.previous.file ?? '?';
      lines.push(`- ~~[${sev}]~~ \`${file}\`: ${(f.previous.title || f.previous.message || '').slice(0, 80)}`);
    }
    lines.push('');
  }

  if (scoreChanged.length) {
    lines.push('### Score changes');
    for (const f of scoreChanged) {
      const delta = f.scoreDelta ?? 0;
      const sign = delta > 0 ? '+' : '';
      lines.push(`- \`${f.current.file ?? '?'}\` (${f.current.ruleId}): score ${sign}${delta.toFixed(2)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
