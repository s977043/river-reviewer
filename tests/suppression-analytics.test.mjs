import test from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeSuppressions,
  formatIssueBody,
  THRESHOLDS,
} from '../scripts/suppression-analytics.mjs';

const NOW = new Date('2026-06-10T00:00:00Z');

function suppression({
  fingerprint = 'a1b2c3d4e5f60718',
  sourcePR = 1,
  severity = 'minor',
  createdAt = '2026-06-01T00:00:00Z',
  active = true,
  expiresAt = null,
} = {}) {
  return {
    id: `sup-${fingerprint}-${sourcePR}`,
    type: 'suppression',
    createdAt,
    context: { fingerprint, sourcePR, severity, active, ...(expiresAt ? { expiresAt } : {}) },
  };
}

test('flags a fingerprint suppressed across 3+ distinct PRs', () => {
  const entries = [
    suppression({ sourcePR: 10 }),
    suppression({ sourcePR: 11 }),
    suppression({ sourcePR: 12 }),
    suppression({ fingerprint: 'ffffffffffffffff', sourcePR: 10 }),
  ];
  const result = analyzeSuppressions(entries, { now: NOW });
  assert.equal(result.repeatedFingerprints.length, 1);
  assert.equal(result.repeatedFingerprints[0].fingerprint, 'a1b2c3d4e5f60718');
  assert.deepEqual(result.repeatedFingerprints[0].prs, [10, 11, 12]);
});

test('same PR repeated does not count toward the repeat threshold', () => {
  const entries = [
    suppression({ sourcePR: 10 }),
    suppression({ sourcePR: 10 }),
    suppression({ sourcePR: 10 }),
  ];
  const result = analyzeSuppressions(entries, { now: NOW });
  assert.equal(result.repeatedFingerprints.length, 0);
});

test('flags stale major/critical suppressions but not recent or minor ones', () => {
  const entries = [
    suppression({ severity: 'major', createdAt: '2026-05-01T00:00:00Z' }), // 40d old
    suppression({ severity: 'critical', createdAt: '2026-06-09T00:00:00Z', sourcePR: 2 }), // 1d old
    suppression({ severity: 'minor', createdAt: '2026-01-01T00:00:00Z', sourcePR: 3 }), // old but minor
  ];
  const result = analyzeSuppressions(entries, { now: NOW });
  assert.equal(result.staleHighSeverity.length, 1);
  assert.equal(result.staleHighSeverity[0].severity, 'major');
  assert.ok(result.staleHighSeverity[0].ageDays >= THRESHOLDS.staleHighSeverityDays);
});

test('inactive, expired, and non-suppression entries are excluded', () => {
  const entries = [
    suppression({ active: false }),
    suppression({ expiresAt: '2026-06-01T00:00:00Z', sourcePR: 2 }),
    { type: 'adr', context: {} },
    suppression({ sourcePR: 3 }),
  ];
  const result = analyzeSuppressions(entries, { now: NOW });
  assert.equal(result.active, 1);
});

test('formatIssueBody renders both signal sections with next action', () => {
  const result = analyzeSuppressions(
    [
      suppression({ sourcePR: 10 }),
      suppression({ sourcePR: 11 }),
      suppression({ sourcePR: 12, severity: 'major', createdAt: '2026-05-01T00:00:00Z' }),
    ],
    { now: NOW }
  );
  const body = formatIssueBody(result);
  assert.match(body, /反復 suppress/);
  assert.match(body, /長期滞留/);
  assert.match(body, /skill-optimizer/);
});
