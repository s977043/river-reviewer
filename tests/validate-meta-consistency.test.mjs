import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractActionTags,
  extractLatestRelease,
  validateMeta,
} from '../scripts/validate-meta-consistency.mjs';

test('extractActionTags finds versioned tags', () => {
  const text = `
    uses: s977043/river-reviewer/runners/github-action@v0.10.0
    uses: s977043/river-reviewer/runners/github-action@v0.10.0
  `;
  const tags = extractActionTags(text);
  assert.deepEqual(tags, ['v0.10.0']);
});

test('extractActionTags finds multiple different tags', () => {
  const text = `
    uses: s977043/river-reviewer/runners/github-action@v0.10.0
    uses: s977043/river-reviewer/runners/github-action@v0.5.0
  `;
  const tags = extractActionTags(text);
  assert.equal(tags.length, 2);
  assert.ok(tags.includes('v0.10.0'));
  assert.ok(tags.includes('v0.5.0'));
});

test('extractActionTags returns empty for no matches', () => {
  assert.deepEqual(extractActionTags('no tags here'), []);
});

test('extractLatestRelease finds Japanese format', () => {
  const text = '最新リリース: [v0.10.0](https://example.com)';
  assert.equal(extractLatestRelease(text), '0.10.0');
});

test('extractLatestRelease finds English format', () => {
  const text = 'Latest release: [v0.10.0](https://example.com)';
  assert.equal(extractLatestRelease(text), '0.10.0');
});

test('extractLatestRelease returns null for no match', () => {
  assert.equal(extractLatestRelease('no release here'), null);
});

test('validateMeta passes on current repo state', async () => {
  const errors = await validateMeta();
  assert.deepEqual(
    errors,
    [],
    `Expected no errors but got: ${errors.join(', ')}`,
  );
});
