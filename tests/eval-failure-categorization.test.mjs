import assert from 'node:assert/strict';
import test from 'node:test';

import { categorizeFailure } from '../src/lib/review-fixtures-eval.mjs';

test('categorizeFailure: missing "Evidence:" token → missing_evidence', () => {
  const result = categorizeFailure({ token: 'Evidence:' });
  assert.equal(result.category, 'missing_evidence');
  assert.match(result.description, /Evidence:/);
});

test('categorizeFailure: missing "Severity: blocker" token → severity_mismatch', () => {
  const result = categorizeFailure({ token: 'Severity: blocker' });
  assert.equal(result.category, 'severity_mismatch');
  assert.match(result.description, /Severity: blocker/);
});

test('categorizeFailure: missing "Severity: warning" token → severity_mismatch', () => {
  const result = categorizeFailure({ token: 'Severity: warning' });
  assert.equal(result.category, 'severity_mismatch');
  assert.match(result.description, /Severity: warning/);
});

test('categorizeFailure: guard case with findings → false_positive', () => {
  const result = categorizeFailure({ isGuardCase: true, findingCount: 2 });
  assert.equal(result.category, 'false_positive');
  assert.match(result.description, /guard case/);
});

test('categorizeFailure: zero findings when expected → routing_miss', () => {
  const result = categorizeFailure({ findingCount: 0, minFindings: 1 });
  assert.equal(result.category, 'routing_miss');
  assert.match(result.description, /expected at least 1/);
});

test('categorizeFailure: too many findings → weak_explanation', () => {
  const result = categorizeFailure({ findingCount: 5, maxFindings: 3 });
  assert.equal(result.category, 'weak_explanation');
  assert.match(result.description, /too many findings/);
});

test('categorizeFailure: other missing token → missing_context', () => {
  const result = categorizeFailure({ token: 'Fix:' });
  assert.equal(result.category, 'missing_context');
  assert.match(result.description, /Fix:/);
});

test('categorizeFailure: generic token "GitHub Secrets" → missing_context', () => {
  const result = categorizeFailure({ token: 'GitHub Secrets' });
  assert.equal(result.category, 'missing_context');
  assert.match(result.description, /GitHub Secrets/);
});

test('categorizeFailure: no context → missing_context fallback', () => {
  const result = categorizeFailure({});
  assert.equal(result.category, 'missing_context');
  assert.match(result.description, /unclassified/);
});

test('categorizeFailure: guard case priority over token check', () => {
  // When guard case is violated, the guard check fires first
  const result = categorizeFailure({ isGuardCase: true, findingCount: 1 });
  assert.equal(result.category, 'false_positive');
});

test('categorizeFailure: routing_miss with higher minFindings', () => {
  const result = categorizeFailure({ findingCount: 0, minFindings: 3 });
  assert.equal(result.category, 'routing_miss');
  assert.match(result.description, /expected at least 3/);
});
