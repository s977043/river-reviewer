import assert from 'node:assert/strict';
import test from 'node:test';

import {
  _PRESETS,
  presetForReviewMode,
  resolveContextBudget,
} from '../src/lib/context-presets.mjs';

test('presetForReviewMode returns the documented preset for tiny / medium / large', () => {
  for (const mode of ['tiny', 'medium', 'large']) {
    const preset = presetForReviewMode(mode);
    assert.ok(preset, `preset for ${mode} should exist`);
    assert.ok(typeof preset.maxTokens === 'number');
    assert.ok(preset.perSectionCaps);
  }
});

test('presetForReviewMode returns null for unknown / falsy modes', () => {
  assert.equal(presetForReviewMode(null), null);
  assert.equal(presetForReviewMode(undefined), null);
  assert.equal(presetForReviewMode(''), null);
  assert.equal(presetForReviewMode('huge'), null);
});

test('preset budgets are ordered tiny < medium < large', () => {
  assert.ok(_PRESETS.tiny.maxTokens < _PRESETS.medium.maxTokens);
  assert.ok(_PRESETS.medium.maxTokens < _PRESETS.large.maxTokens);
});

test('preset perSectionCaps grow with the preset size', () => {
  for (const section of ['fullFile', 'tests', 'usages', 'config']) {
    assert.ok(
      _PRESETS.tiny.perSectionCaps[section] <= _PRESETS.medium.perSectionCaps[section]
    );
    assert.ok(
      _PRESETS.medium.perSectionCaps[section] <= _PRESETS.large.perSectionCaps[section]
    );
  }
});

test('resolveContextBudget returns null when both budget and reviewMode are absent', () => {
  assert.equal(resolveContextBudget(null), null);
  assert.equal(resolveContextBudget(undefined), null);
  assert.equal(resolveContextBudget({}), null);
});

test('resolveContextBudget prefers explicit budget over reviewMode', () => {
  const explicit = { maxTokens: 9999 };
  const resolved = resolveContextBudget({ budget: explicit, reviewMode: 'tiny' });
  assert.equal(resolved, explicit);
});

test('resolveContextBudget falls back to preset when budget is omitted', () => {
  const resolved = resolveContextBudget({ reviewMode: 'medium' });
  assert.equal(resolved, _PRESETS.medium);
});

test('resolveContextBudget returns null for unknown reviewMode without budget', () => {
  assert.equal(resolveContextBudget({ reviewMode: 'huge' }), null);
});

test('preset objects are frozen so callers cannot mutate them', () => {
  assert.throws(
    () => {
      _PRESETS.medium.maxTokens = 999_999;
    },
    /read[- ]only|object is not extensible/i
  );
  assert.throws(
    () => {
      _PRESETS.medium.perSectionCaps.fullFile = 0;
    },
    /read[- ]only|object is not extensible/i
  );
});
