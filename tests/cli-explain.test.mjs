// tests/cli-explain.test.mjs
//
// printExplain (#1045 A3): human-readable skill / gate / config resolution.

import assert from 'node:assert/strict';
import test from 'node:test';

import { printExplain } from '../src/cli.mjs';

function capture(result) {
  const lines = [];
  printExplain(result, { log: (m) => lines.push(m) });
  return lines.join('\n');
}

const planWith = (selected = [], skipped = []) => ({
  selected: selected.map((id) => ({ metadata: { id } })),
  skipped: skipped.map(({ id, reasons }) => ({ skill: { metadata: { id } }, reasons })),
});

test('reports the repository-local config tier and path', () => {
  const out = capture({
    configSource: 'file',
    configPath: '/repo/.river-review.json',
    plan: planWith(['s1']),
  });
  assert.match(out, /Config: repository-local \(\/repo\/\.river-review\.json\)/);
});

test('reports the user-global tier', () => {
  const out = capture({
    configSource: 'global',
    configPath: '/home/u/.river-review/config.json',
    plan: planWith(),
  });
  assert.match(out, /Config: user-global/);
});

test('reports built-in default when no config file', () => {
  const out = capture({ configSource: 'default', plan: planWith() });
  assert.match(out, /Config: built-in default/);
});

test('lists selected and skipped skills with reasons', () => {
  const out = capture({
    configSource: 'default',
    plan: planWith(['s1', 's2'], [{ id: 's3', reasons: ['phase mismatch'] }]),
  });
  assert.match(out, /Selected skills \(2\): s1, s2/);
  assert.match(out, /Skipped skills \(1\)/);
  assert.match(out, /s3: phase mismatch/);
});

test('handles an empty plan without throwing', () => {
  const out = capture({ configSource: 'default', plan: planWith() });
  assert.match(out, /Selected skills \(0\): none matched this diff/);
});

test('does not throw when plan is missing entirely (#1144 gemini)', () => {
  // result.plan undefined → printExplain must not crash (formatPlan defaults).
  const out = capture({ configSource: 'default' });
  assert.match(out, /Selected skills \(0\)/);
});
