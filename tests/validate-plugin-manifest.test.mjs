import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePluginManifest } from '../scripts/validate-plugin-manifest.mjs';

test('validatePluginManifest passes on current repo state', async () => {
  const errors = await validatePluginManifest();
  assert.deepEqual(errors, [], `Expected no errors but got: ${errors.join(', ')}`);
});
