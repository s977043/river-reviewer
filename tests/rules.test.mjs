import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { loadProjectRules } from '../src/lib/rules.mjs';
import { withTempDir } from './helpers/temp-dir.mjs';

test('loadProjectRules returns null when rules file is absent', async () => {
  await withTempDir(
    async (dir) => {
      const { rulesText } = await loadProjectRules(dir);
      assert.equal(rulesText, null);
    },
    { prefix: 'river-rules-' }
  );
});

test('loadProjectRules loads content when rules file exists', async () => {
  await withTempDir(
    async (dir) => {
      const rulesDir = path.join(dir, '.river');
      await mkdir(rulesDir, { recursive: true });
      const rulesPath = path.join(rulesDir, 'rules.md');
      writeFileSync(rulesPath, '- Follow project guide');

      const { rulesText, path: resolvedPath } = await loadProjectRules(dir);
      assert.equal(rulesText, '- Follow project guide');
      assert.equal(resolvedPath, rulesPath);
    },
    { prefix: 'river-rules-' }
  );
});

test('loadProjectRules returns null when rules file is empty or whitespace', async () => {
  await withTempDir(
    async (dir) => {
      const rulesDir = path.join(dir, '.river');
      await mkdir(rulesDir, { recursive: true });
      const rulesPath = path.join(rulesDir, 'rules.md');
      writeFileSync(rulesPath, '   \n  ');

      const { rulesText } = await loadProjectRules(dir);
      assert.equal(rulesText, null);
    },
    { prefix: 'river-rules-' }
  );
});
