import { computeFindingBreakdown } from './scoring/breakdown.mjs';

export const SUPPRESS_REASONS = {
  LOW_CONFIDENCE: 'low_confidence',
  DUPLICATE: 'duplicate',
  STYLE_ONLY: 'style_only',
  INSUFFICIENT_EVIDENCE: 'insufficient_evidence',
  COVERED_BY_HIGHER_LEVEL: 'covered_by_higher_level_finding',
};

function evidenceTotalChars(finding) {
  const ev = finding.evidence;
  if (!Array.isArray(ev) || ev.length === 0) return 0;
  return ev.reduce((sum, e) => sum + String(e ?? '').length, 0);
}

function deduplicateWithinFile(findings) {
  const seen = new Set();
  return findings.filter((f) => {
    const ruleId = String(f.ruleId ?? '');
    if (ruleId === 'unknown') return true; // ruleId が未確定の finding は file-level dedup もスキップ
    const key = `${f.file ?? ''}::${ruleId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateWithinPR(findings) {
  const seen = new Set();
  return findings.filter((f) => {
    const key = String(f.ruleId ?? '');
    if (key === 'unknown') return true; // ruleId が確定していない finding は PR-level dedup をスキップ
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * @param {object[]} findings
 * @param {{ reviewMode?: 'tiny'|'medium'|'large' }} [options]
 * @returns {{ overview: object[], inlineCandidates: object[], suppressed: object[] }}
 */
export function classifyFindings(findings, options = {}) {
  const reviewMode = options.reviewMode ?? 'medium';
  const maxOverview = reviewMode === 'tiny' ? 3 : reviewMode === 'large' ? 8 : 5;

  const suppressed = [];
  const active = [];

  for (const finding of findings) {
    if (finding.confidence === 'low' && finding.severity !== 'critical') {
      suppressed.push({ ...finding, suppressReason: SUPPRESS_REASONS.LOW_CONFIDENCE });
      continue;
    }
    if (evidenceTotalChars(finding) < 30 && finding.severity !== 'critical') {
      suppressed.push({ ...finding, suppressReason: SUPPRESS_REASONS.INSUFFICIENT_EVIDENCE });
      continue;
    }
    const ruleId = String(finding.ruleId ?? '');
    if (finding.severity === 'minor' && /readability|style|format/i.test(ruleId)) {
      suppressed.push({ ...finding, suppressReason: SUPPRESS_REASONS.STYLE_ONLY });
      continue;
    }
    active.push(finding);
  }

  const deduped = deduplicateWithinPR(deduplicateWithinFile(active));
  const dedupedSet = new Set(deduped.map((f) => f.id));
  for (const f of active) {
    if (!dedupedSet.has(f.id)) {
      suppressed.push({ ...f, suppressReason: SUPPRESS_REASONS.DUPLICATE });
    }
  }

  const sorted = [...deduped].sort(
    (a, b) => computeFindingBreakdown(b).composite - computeFindingBreakdown(a).composite
  );

  const overview = [];
  const overviewRuleIds = new Set();
  for (const f of sorted) {
    const rid = String(f.ruleId ?? '');
    const isUnknown = rid === 'unknown';
    if (!isUnknown && overviewRuleIds.has(rid)) {
      suppressed.push({ ...f, suppressReason: SUPPRESS_REASONS.COVERED_BY_HIGHER_LEVEL });
    } else if (overview.length < maxOverview) {
      overview.push(f);
      if (!isUnknown) overviewRuleIds.add(rid);
    } else {
      suppressed.push({ ...f, suppressReason: SUPPRESS_REASONS.COVERED_BY_HIGHER_LEVEL });
    }
  }

  return { overview, inlineCandidates: [], suppressed };
}
