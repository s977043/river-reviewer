// #936 — replay drift detection (membership-only; content drift is not
// derivable because plans do not snapshot diff bytes).
import assert from 'node:assert/strict';
import test from 'node:test';
import { computeReplayDrift } from '../src/lib/review-plan.mjs';

const snapshot = (files) => ({ fileTypes: { app: files, test: [], config: [] } });

test('computeReplayDrift returns null when the snapshot predates A2-3 (no fileTypes)', () => {
  assert.equal(computeReplayDrift(['a.ts'], null), null);
  assert.equal(computeReplayDrift(['a.ts'], {}), null);
});

test('computeReplayDrift reports no drift when file sets match', () => {
  const drift = computeReplayDrift(['src/a.ts', 'src/b.ts'], snapshot(['src/a.ts', 'src/b.ts']));
  assert.deepEqual(drift.filesAdded, []);
  assert.deepEqual(drift.filesRemoved, []);
  assert.match(drift.summary, /no membership drift/);
});

test('computeReplayDrift reports added/removed files', () => {
  const drift = computeReplayDrift(
    ['src/a.ts', 'src/c.ts'], // c added, b removed vs source
    snapshot(['src/a.ts', 'src/b.ts'])
  );
  assert.deepEqual(drift.filesAdded, ['src/c.ts']);
  assert.deepEqual(drift.filesRemoved, ['src/b.ts']);
  assert.match(drift.summary, /\+1\/-1/);
  assert.match(drift.summary, /content-level changes not detectable/);
});

test('computeReplayDrift ignores the /dev/null deletion sentinel', () => {
  // A deleted file surfaces as /dev/null in unified diffs; it must not be
  // reported as an added/removed path.
  const drift = computeReplayDrift(['src/a.ts', '/dev/null'], snapshot(['src/a.ts']));
  assert.deepEqual(drift.filesAdded, []);
  assert.deepEqual(drift.filesRemoved, []);
  assert.match(drift.summary, /no membership drift/);
});

test('computeReplayDrift unions all fileType categories and dedupes', () => {
  const src = { fileTypes: { app: ['src/a.ts'], test: ['src/a.test.ts'], config: ['src/a.ts'] } };
  const drift = computeReplayDrift(['src/a.ts'], src);
  // source set = {src/a.ts, src/a.test.ts}; current = {src/a.ts} → a.test.ts removed
  assert.deepEqual(drift.filesAdded, []);
  assert.deepEqual(drift.filesRemoved, ['src/a.test.ts']);
});
