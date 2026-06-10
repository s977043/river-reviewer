import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs/promises';

import { hasSelection, resolveSelectionSkillIds } from '../src/lib/selection.mjs';
import { ConfigSchema, selectionConfigSchema } from '../src/config/schema.mjs';
import { createTempDirAsync } from './helpers/temp-dir.mjs';

const SKILL_MD = (id, tags) => `---
id: ${id}
name: Skill ${id}
description: test skill
category: midstream
phase: midstream
applyTo:
  - 'src/**/*.ts'
tags: [${tags.join(', ')}]
severity: minor
inputContext: [diff]
outputKind: [findings]
---

## Guidance

- test
`;

async function buildSkillsDir() {
  const dir = await createTempDirAsync({ prefix: 'selection-' });
  const skills = [
    ['skill-ts-a', ['typescript', 'midstream']],
    ['skill-ts-b', ['typescript', 'midstream']],
    ['skill-a11y', ['a11y', 'midstream']],
    ['skill-other', ['security', 'midstream']],
  ];
  for (const [id, tags] of skills) {
    const skillDir = path.join(dir, 'midstream', id);
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), SKILL_MD(id, tags), 'utf8');
  }
  await fs.writeFile(
    path.join(dir, 'registry.yaml'),
    `
packs:
  - id: tspack
    version: '0.1.0'
    name: 'TS'
    description: 'ts'
    axis: technology
    tier: experimental
    sources:
      - name: 'x'
        reviewed_at: '2026-06-11'
    skills:
      - skill-ts-a
      - skill-ts-b
`,
    'utf8'
  );
  return dir;
}

test('hasSelection detects non-empty declarations only', () => {
  assert.equal(hasSelection(undefined), false);
  assert.equal(hasSelection({}), false);
  assert.equal(hasSelection({ packs: [], tags: [], skills: { include: [] } }), false);
  assert.equal(hasSelection({ packs: ['x'] }), true);
  assert.equal(hasSelection({ tags: ['a11y'] }), true);
  assert.equal(hasSelection({ skills: { include: ['s'] } }), true);
  // exclude-only does not constitute a selection
  assert.equal(hasSelection({ skills: { exclude: ['s'] } }), false);
});

test('resolves packs + tags + include with exclude and dedup', async () => {
  const skillsDir = await buildSkillsDir();
  const ids = await resolveSelectionSkillIds(
    {
      packs: ['tspack'],
      tags: ['a11y'],
      skills: { include: ['skill-other', 'skill-ts-a'], exclude: ['skill-ts-b'] },
    },
    { skillsDir, warn: () => {} }
  );
  assert.deepEqual(ids, ['skill-ts-a', 'skill-a11y', 'skill-other']);
});

test('unknown pack id throws with available pack list', async () => {
  const skillsDir = await buildSkillsDir();
  await assert.rejects(
    resolveSelectionSkillIds({ packs: ['nope'] }, { skillsDir, warn: () => {} }),
    /unknown pack "nope".*tspack/
  );
});

test('explicit pack below minTier warns but still runs', async () => {
  const skillsDir = await buildSkillsDir();
  const warnings = [];
  const ids = await resolveSelectionSkillIds(
    { packs: ['tspack'], minTier: 'community' },
    { skillsDir, warn: (m) => warnings.push(m) }
  );
  assert.deepEqual(ids, ['skill-ts-a', 'skill-ts-b']);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /below minTier/);
});

test('empty selection resolves to null (no constraint)', async () => {
  assert.equal(await resolveSelectionSkillIds({}, { warn: () => {} }), null);
  assert.equal(await resolveSelectionSkillIds(undefined, { warn: () => {} }), null);
});

test('config schema accepts and defaults the selection section', () => {
  const parsed = ConfigSchema.parse({ selection: { packs: ['typescript'] } });
  assert.deepEqual(parsed.selection.packs, ['typescript']);
  assert.deepEqual(parsed.selection.tags, []);
  assert.deepEqual(parsed.selection.skills, { include: [], exclude: [] });

  assert.throws(() => selectionConfigSchema.parse({ minTier: 'gold' }));
});
