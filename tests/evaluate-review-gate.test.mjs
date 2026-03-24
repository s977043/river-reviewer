import assert from 'node:assert/strict';
import path from 'node:path';
import url from 'node:url';
import test from 'node:test';
import { evaluateGate } from '../scripts/evaluate-review-gate.mjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures', 'review-gate');

test('passes when no issues exist', async () => {
  const result = await evaluateGate({
    input: path.join(fixturesDir, 'pass.json'),
    failOnCritical: 1,
    failOnMajor: null,
  });
  assert.equal(result.pass, true);
  assert.ok(result.summary.includes('PASSED'));
});

test('fails when critical count meets threshold', async () => {
  const result = await evaluateGate({
    input: path.join(fixturesDir, 'fail-critical.json'),
    failOnCritical: 1,
    failOnMajor: null,
  });
  assert.equal(result.pass, false);
  assert.ok(result.summary.includes('FAILED'));
  assert.ok(result.summary.includes('critical'));
});

test('passes when critical threshold is higher than count', async () => {
  const result = await evaluateGate({
    input: path.join(fixturesDir, 'fail-critical.json'),
    failOnCritical: 5,
    failOnMajor: null,
  });
  assert.equal(result.pass, true);
});

test('fails when major count meets threshold', async () => {
  const result = await evaluateGate({
    input: path.join(fixturesDir, 'fail-major.json'),
    failOnCritical: 1,
    failOnMajor: 3,
  });
  assert.equal(result.pass, false);
  assert.ok(result.summary.includes('major'));
});

test('passes when major threshold is null (disabled)', async () => {
  const result = await evaluateGate({
    input: path.join(fixturesDir, 'fail-major.json'),
    failOnCritical: 1,
    failOnMajor: null,
  });
  assert.equal(result.pass, true);
});

test('table contains all severity rows', async () => {
  const result = await evaluateGate({
    input: path.join(fixturesDir, 'fail-critical.json'),
    failOnCritical: 1,
    failOnMajor: null,
  });
  assert.ok(result.table.includes('critical'));
  assert.ok(result.table.includes('major'));
  assert.ok(result.table.includes('minor'));
  assert.ok(result.table.includes('info'));
});

test('mixed severity: fails on critical threshold', async () => {
  const result = await evaluateGate({
    input: path.join(fixturesDir, 'mixed.json'),
    failOnCritical: 1,
    failOnMajor: null,
  });
  assert.equal(result.pass, false);
  assert.ok(result.summary.includes('critical'));
});

test('mixed severity: fails on both critical and major thresholds', async () => {
  const result = await evaluateGate({
    input: path.join(fixturesDir, 'mixed.json'),
    failOnCritical: 1,
    failOnMajor: 2,
  });
  assert.equal(result.pass, false);
  assert.ok(result.summary.includes('critical'));
  assert.ok(result.summary.includes('major'));
});

test('mixed severity: passes when thresholds exceed counts', async () => {
  const result = await evaluateGate({
    input: path.join(fixturesDir, 'mixed.json'),
    failOnCritical: 5,
    failOnMajor: 10,
  });
  assert.equal(result.pass, true);
});

test('mixed severity: table shows correct counts', async () => {
  const result = await evaluateGate({
    input: path.join(fixturesDir, 'mixed.json'),
    failOnCritical: 1,
    failOnMajor: null,
  });
  assert.ok(result.table.includes('| critical | 1'));
  assert.ok(result.table.includes('| major | 2'));
  assert.ok(result.table.includes('| minor | 1'));
  assert.ok(result.table.includes('| info | 1'));
});

test('throws on invalid input (missing summary)', async () => {
  const tmpPath = path.join(fixturesDir, '..', 'invalid-gate-input.json');
  const { writeFile, rm } = await import('node:fs/promises');
  await writeFile(tmpPath, JSON.stringify({ issues: [] }));
  try {
    await assert.rejects(
      () => evaluateGate({ input: tmpPath, failOnCritical: 1, failOnMajor: null }),
      /missing summary/,
    );
  } finally {
    await rm(tmpPath, { force: true });
  }
});
