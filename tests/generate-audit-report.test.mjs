import assert from 'node:assert/strict';
import test from 'node:test';
import { generateReport, computeTrend, formatMetric } from '../scripts/generate-audit-report.mjs';

const sampleEnvelope = {
  version: '0.12.0',
  timestamp: '2026-04-09T00:00:00Z',
  commit: 'abc1234',
  branch: 'main',
  scores: { planner_coverage: 0.8, planner_mrr: 0.6, fixtures_passRate: 0.9, meta_errorCount: 0 },
  results: [
    { name: 'planner', pass: true, errors: [] },
    { name: 'fixtures', pass: true, errors: [] },
    { name: 'meta', pass: true, errors: [] },
  ],
  status: 'pass',
};

test('generateReport produces markdown from valid envelope', () => {
  const md = generateReport(sampleEnvelope, null);
  assert.ok(md.includes('# Nightly Audit Report'));
  assert.ok(md.includes('abc1234'));
  assert.ok(md.includes('PASS'));
  assert.ok(md.includes('No previous data'));
});

test('generateReport handles null previous entry', () => {
  const md = generateReport(sampleEnvelope, null);
  assert.ok(md.includes('No previous data'));
  assert.ok(!md.includes('DEGRADED'));
});

test('generateReport shows trend when previous entry exists', () => {
  const prev = { ...sampleEnvelope, scores: { planner_coverage: 0.85, planner_mrr: 0.6 } };
  const md = generateReport(sampleEnvelope, prev);
  assert.ok(md.includes('Trend Comparison'));
  assert.ok(md.includes('planner_coverage'));
});

test('generateReport flags degradation over 5%', () => {
  const prev = { ...sampleEnvelope, scores: { planner_coverage: 0.95 } };
  const current = { ...sampleEnvelope, scores: { planner_coverage: 0.8 } };
  const md = generateReport(current, prev);
  assert.ok(md.includes('DEGRADED'));
  assert.ok(md.includes('Degradation Alert'));
});

test('computeTrend returns empty for no previous scores', () => {
  assert.deepEqual(computeTrend(sampleEnvelope, null), []);
});

test('computeTrend calculates deltas correctly', () => {
  const prev = { scores: { planner_coverage: 0.9 } };
  const current = { scores: { planner_coverage: 0.8 } };
  const trends = computeTrend(current, prev);
  assert.equal(trends.length, 1);
  assert.ok(Math.abs(trends[0].delta - (-0.1)) < 0.001);
  assert.equal(trends[0].degraded, true);
});

test('formatMetric shows percentage for ratio metrics', () => {
  assert.equal(formatMetric('coverage', 0.85), '85.0%');
  assert.equal(formatMetric('errorCount', 3), '3');
  assert.equal(formatMetric('unknown', null), '-');
});

test('generateReport handles empty results array', () => {
  const empty = { ...sampleEnvelope, results: [], scores: {} };
  const md = generateReport(empty, null);
  assert.ok(md.includes('# Nightly Audit Report'));
});
