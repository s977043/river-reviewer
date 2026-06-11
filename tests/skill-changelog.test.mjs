// tests/skill-changelog.test.mjs
//
// Skill changelog generator (#1016): manifest diff classification (added /
// changed / removed) and Markdown rendering.

import assert from 'node:assert/strict';
import test from 'node:test';

import { diffManifests, renderSkillChangelog } from '../scripts/skill-changelog.mjs';

const skill = (id, checksum) => ({ id, checksum, path: `skills/${id}`, files: 1 });

test('diffManifests classifies added / changed / removed by id + checksum', () => {
  const prev = [skill('a', 'sha256:1'), skill('b', 'sha256:2'), skill('c', 'sha256:3')];
  const curr = [
    skill('a', 'sha256:1'), // unchanged
    skill('b', 'sha256:CHANGED'), // changed
    skill('d', 'sha256:4'), // added
    // 'c' removed
  ];

  const diff = diffManifests(prev, curr);
  assert.deepEqual(diff, { added: ['d'], changed: ['b'], removed: ['c'] });
});

test('diffManifests returns empty lists when nothing changed', () => {
  const m = [skill('a', 'sha256:1'), skill('b', 'sha256:2')];
  assert.deepEqual(diffManifests(m, m), { added: [], changed: [], removed: [] });
});

test('diffManifests sorts each list by id', () => {
  const prev = [];
  const curr = [skill('z', 'x'), skill('a', 'x'), skill('m', 'x')];
  assert.deepEqual(diffManifests(prev, curr).added, ['a', 'm', 'z']);
});

test('diffManifests tolerates null / undefined inputs', () => {
  assert.deepEqual(diffManifests(null, undefined), { added: [], changed: [], removed: [] });
});

test('renderSkillChangelog returns empty string when there are no changes', () => {
  assert.equal(renderSkillChangelog({ added: [], changed: [], removed: [] }), '');
});

test('renderSkillChangelog renders headings and ids for changes', () => {
  const out = renderSkillChangelog({ added: ['d'], changed: ['b'], removed: ['c'] });
  assert.match(out, /### Skills changed/);
  assert.match(out, /\*\*Changed\*\* \(1\)/);
  assert.match(out, /\*\*Added\*\* \(1\)/);
  assert.match(out, /\*\*Removed\*\* \(1\)/);
  assert.match(out, /- `b`/);
  assert.match(out, /- `d`/);
  assert.match(out, /- `c`/);
  // adopter drift-detection hint references the manifest path
  assert.match(out, /docs\/data\/skill-manifest\.json/);
});

test('renderSkillChangelog omits empty sections', () => {
  const out = renderSkillChangelog({ added: ['x'], changed: [], removed: [] });
  assert.match(out, /\*\*Added\*\*/);
  assert.doesNotMatch(out, /\*\*Changed\*\*/);
  assert.doesNotMatch(out, /\*\*Removed\*\*/);
});
