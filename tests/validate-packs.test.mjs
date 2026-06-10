import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs/promises';

import { validatePacks } from '../scripts/validate-skills.mjs';
import { createTempDirAsync } from './helpers/temp-dir.mjs';

const TMP_PREFIX = 'validate-packs-';
const repoRoot = path.resolve(path.join(import.meta.dirname, '..'));

const SKILL_MD = (id) => `---
id: ${id}
name: Skill ${id}
description: test skill
category: midstream
phase: midstream
applyTo:
  - 'src/**/*.ts'
tags: [test, midstream]
severity: minor
inputContext: [diff]
outputKind: [findings]
---

## Guidance

- test
`;

async function buildSkillsDir({ packYaml, skills = ['skill-a'], withAssets = false }) {
  const dir = await createTempDirAsync({ prefix: TMP_PREFIX });
  for (const id of skills) {
    const skillDir = path.join(dir, 'midstream', id);
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), SKILL_MD(id), 'utf8');
    if (withAssets) {
      await fs.mkdir(path.join(skillDir, 'fixtures'), { recursive: true });
    }
  }
  await fs.writeFile(path.join(dir, 'registry.yaml'), packYaml, 'utf8');
  return dir;
}

const packEntry = ({ id = 'demo', tier = 'community', skillIds = ['skill-a'] } = {}) => `
packs:
  - id: ${id}
    version: '0.1.0'
    name: 'Demo Pack'
    description: 'demo'
    axis: technology
    tier: ${tier}
    sources:
      - name: 'river-review original'
        reviewed_at: '2026-06-10'
    skills:
${skillIds.map((s) => `      - ${s}`).join('\n')}
`;

test('validatePacks passes for a well-formed community pack', async () => {
  const skillsDir = await buildSkillsDir({ packYaml: packEntry() });
  assert.equal(await validatePacks({ skillsDir, repoRoot }), true);
});

test('validatePacks fails when a referenced skill id does not exist', async () => {
  const skillsDir = await buildSkillsDir({
    packYaml: packEntry({ skillIds: ['skill-a', 'ghost-skill'] }),
  });
  assert.equal(await validatePacks({ skillsDir, repoRoot }), false);
});

test('validatePacks fails schema validation for a bad axis value', async () => {
  const skillsDir = await buildSkillsDir({
    packYaml: packEntry().replace('axis: technology', 'axis: vibes'),
  });
  assert.equal(await validatePacks({ skillsDir, repoRoot }), false);
});

test('gate-of-the-gate canary: official tier without fixtures must fail', async () => {
  const skillsDir = await buildSkillsDir({ packYaml: packEntry({ tier: 'official' }) });
  assert.equal(
    await validatePacks({ skillsDir, repoRoot }),
    false,
    'a low-quality pack must not pass the official gate'
  );
});

test('official tier with fixtures assets passes the mechanical gate', async () => {
  const skillsDir = await buildSkillsDir({
    packYaml: packEntry({ tier: 'official' }),
    withAssets: true,
  });
  assert.equal(await validatePacks({ skillsDir, repoRoot }), true);
});

test('real registry packs section validates', async () => {
  assert.equal(await validatePacks({}), true);
});
