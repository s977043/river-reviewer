import test from 'node:test';
import assert from 'node:assert/strict';

import { assessTier, checkPackTiers } from '../scripts/pack-tier-check.mjs';

const index = new Map([
  ['with-assets-a', { hasAssets: true }],
  ['with-assets-b', { hasAssets: true }],
  ['bare', { hasAssets: false }],
]);

test('assessTier: all skills with assets → official', () => {
  assert.equal(assessTier({ skills: ['with-assets-a', 'with-assets-b'] }, index), 'official');
});

test('assessTier: some skills with assets → community', () => {
  assert.equal(assessTier({ skills: ['with-assets-a', 'bare'] }, index), 'community');
});

test('assessTier: no assets (or unknown ids) → experimental', () => {
  assert.equal(assessTier({ skills: ['bare'] }, index), 'experimental');
  assert.equal(assessTier({ skills: ['ghost'] }, index), 'experimental');
  assert.equal(assessTier({ skills: [] }, index), 'experimental');
});

test('real registry: no pack declares a tier above its mechanical assessment', async () => {
  const logs = [];
  const result = await checkPackTiers({ log: (m) => logs.push(m) });
  assert.ok(result.packs >= 2, 'typescript and ddd packs are declared');
  assert.deepEqual(
    result.overDeclared,
    [],
    `over-declared tiers found: ${JSON.stringify(result.overDeclared)}`
  );
});
