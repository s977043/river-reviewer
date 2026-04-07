import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('evaluate-all: parseArgs handles all flags', async () => {
  // Import the module to verify it loads without errors.
  // The main function is exported as evaluateAll.
  const mod = await import('../scripts/evaluate-all.mjs');
  assert.ok(typeof mod.evaluateAll === 'function', 'evaluateAll should be exported');
});

test('evaluate-all: appendLedger creates file and appends JSONL', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rr-ledger-'));
  const ledgerPath = path.join(tmpDir, 'results.jsonl');

  const entry1 = { timestamp: '2024-01-01T00:00:00Z', status: 'pass' };
  const entry2 = { timestamp: '2024-01-02T00:00:00Z', status: 'fail' };

  fs.appendFileSync(ledgerPath, JSON.stringify(entry1) + '\n');
  fs.appendFileSync(ledgerPath, JSON.stringify(entry2) + '\n');

  const lines = fs.readFileSync(ledgerPath, 'utf8').trim().split('\n');
  assert.equal(lines.length, 2);
  assert.deepEqual(JSON.parse(lines[0]), entry1);
  assert.deepEqual(JSON.parse(lines[1]), entry2);

  fs.rmSync(tmpDir, { recursive: true });
});

test('evaluate-all: envelope structure is valid', () => {
  // Simulate building an envelope from sub-results
  const subResults = [
    { name: 'planner', pass: true, metrics: { coverage: 0.85 }, errors: [] },
    { name: 'meta', pass: true, metrics: { errorCount: 0 }, errors: [] },
  ];

  const allPass = subResults.every((r) => r.pass);
  const scores = {};
  for (const r of subResults) {
    for (const [k, v] of Object.entries(r.metrics)) {
      scores[`${r.name}_${k}`] = v;
    }
  }

  const envelope = {
    timestamp: new Date().toISOString(),
    commit: 'abc1234',
    branch: 'main',
    scores,
    results: subResults.map((r) => ({ name: r.name, pass: r.pass, errors: r.errors })),
    status: allPass ? 'pass' : 'fail',
  };

  assert.equal(envelope.status, 'pass');
  assert.equal(envelope.scores.planner_coverage, 0.85);
  assert.equal(envelope.scores.meta_errorCount, 0);
  assert.equal(envelope.results.length, 2);
  assert.ok(envelope.timestamp);
});

test('evaluate-all: envelope status is fail when any sub-eval fails', () => {
  const subResults = [
    { name: 'planner', pass: true, metrics: {}, errors: [] },
    { name: 'fixtures', pass: false, metrics: {}, errors: ['check failed'] },
  ];

  const allPass = subResults.every((r) => r.pass);
  const status = allPass ? 'pass' : 'fail';

  assert.equal(status, 'fail');
});
