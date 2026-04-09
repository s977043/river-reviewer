import assert from 'node:assert/strict';
import path from 'node:path';
import url from 'node:url';
import test from 'node:test';
import { evaluateRegression } from '../src/lib/regression-eval.mjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const CASES_PATH = path.join(__dirname, 'fixtures', 'regression-eval', 'cases.json');

test('evaluateRegression loads and runs all fixture cases', async () => {
  const result = await evaluateRegression({ casesPath: CASES_PATH });
  assert.ok(result.summary.total >= 8, 'Expected at least 8 cases');
  assert.equal(result.cases.length, result.summary.total);
});

test('evaluateRegression returns structured result shape', async () => {
  const result = await evaluateRegression({ casesPath: CASES_PATH });
  assert.equal(typeof result.exitCode, 'number');
  assert.ok(Array.isArray(result.cases));
  assert.equal(typeof result.summary.policyPassRate, 'number');
  assert.equal(typeof result.summary.memoryRecallRate, 'number');
  assert.equal(typeof result.summary.suppressionAccuracy, 'number');
  assert.equal(typeof result.summary.resurfaceAccuracy, 'number');
});

test('evaluateRegression: all current cases pass', async () => {
  const result = await evaluateRegression({ casesPath: CASES_PATH });
  assert.equal(result.exitCode, 0, 'Expected all cases to pass. Failures: ' +
    result.cases.filter(c => !c.pass).map(c => c.name).join(', '));
  assert.equal(result.summary.policyPassRate, 1.0);
});

test('evaluateRegression: memory_recall cases work', async () => {
  const result = await evaluateRegression({ casesPath: CASES_PATH });
  const memoryCases = result.cases.filter(c => c.category === 'memory_recall');
  assert.ok(memoryCases.length >= 3);
  assert.ok(memoryCases.every(c => c.pass));
});

test('evaluateRegression: suppression cases work', async () => {
  const result = await evaluateRegression({ casesPath: CASES_PATH });
  const suppCases = result.cases.filter(c => c.category === 'suppression');
  assert.ok(suppCases.length >= 4);
  assert.ok(suppCases.every(c => c.pass));
});

test('evaluateRegression: resurfacing cases work', async () => {
  const result = await evaluateRegression({ casesPath: CASES_PATH });
  const resCases = result.cases.filter(c => c.category === 'resurfacing');
  assert.ok(resCases.length >= 3);
  assert.ok(resCases.every(c => c.pass));
});
