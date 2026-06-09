// tests/generate-skill-manifest.test.mjs
//
// Skill manifest generator (#1016): determinism, id extraction, and
// checksum sensitivity to content changes.

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  computeSkillEntry,
  extractSkillId,
  findSkillDirs,
  generateManifest,
  renderManifest,
} from '../scripts/generate-skill-manifest.mjs';

async function makeFixtureSkill(root, dirName, { id = null, body = 'hello' } = {}) {
  const dir = path.join(root, 'skills', 'midstream', dirName);
  await fs.mkdir(path.join(dir, 'prompt'), { recursive: true });
  const fm = id ? `---\nid: ${id}\nname: x\n---\n` : '';
  await fs.writeFile(path.join(dir, 'SKILL.md'), `${fm}# Skill\n${body}\n`);
  await fs.writeFile(path.join(dir, 'prompt', 'user.md'), `prompt ${body}\n`);
  return dir;
}

test('extractSkillId reads frontmatter id and falls back to dirname', () => {
  assert.equal(extractSkillId('---\nid: rr-x-001\nname: y\n---\nbody', 'fb'), 'rr-x-001');
  assert.equal(extractSkillId('# no frontmatter', 'fallback-dir'), 'fallback-dir');
});

test('extractSkillId handles CRLF line endings (#1100 review)', () => {
  assert.equal(extractSkillId('---\r\nid: rr-x-001\r\nname: y\r\n---\r\nbody', 'fb'), 'rr-x-001');
});

test('checksum is identical for LF and CRLF content (#1100 review)', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'manifest-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const lfDir = await makeFixtureSkill(root, 'lf-skill', { id: 'rr-eol-001' });
  const lf = await computeSkillEntry(lfDir, root);

  // Rewrite the same files with CRLF line endings; checksum must not change.
  for (const rel of ['SKILL.md', path.join('prompt', 'user.md')]) {
    const p = path.join(lfDir, rel);
    const content = await fs.readFile(p, 'utf8');
    await fs.writeFile(p, content.replaceAll('\n', '\r\n'));
  }
  const crlf = await computeSkillEntry(lfDir, root);
  assert.equal(lf.checksum, crlf.checksum);
});

test('generateManifest is deterministic and sorted by id', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'manifest-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await makeFixtureSkill(root, 'bbb-skill', { id: 'rr-bbb-001' });
  await makeFixtureSkill(root, 'aaa-skill', { id: 'rr-aaa-001' });

  const skillsRoot = path.join(root, 'skills');
  const m1 = await generateManifest({ skillsRoot, rootDir: root });
  const m2 = await generateManifest({ skillsRoot, rootDir: root });
  assert.equal(renderManifest(m1), renderManifest(m2));
  assert.equal(m1.skillCount, 2);
  assert.deepEqual(
    m1.skills.map((s) => s.id),
    ['rr-aaa-001', 'rr-bbb-001']
  );
  assert.match(m1.skills[0].checksum, /^sha256:[0-9a-f]{64}$/);
  assert.equal(m1.skills[0].path.includes('\\'), false);
});

test('checksum changes when any file in the skill dir changes', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'manifest-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const dir = await makeFixtureSkill(root, 'ccc-skill', { id: 'rr-ccc-001' });

  const before = await computeSkillEntry(dir, root);
  await fs.writeFile(path.join(dir, 'prompt', 'user.md'), 'prompt CHANGED\n');
  const after = await computeSkillEntry(dir, root);
  assert.notEqual(before.checksum, after.checksum);
  assert.equal(before.files, after.files);
});

test('findSkillDirs does not descend into a skill dir (no nested doubles)', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'manifest-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const dir = await makeFixtureSkill(root, 'ddd-skill', { id: 'rr-ddd-001' });
  // A stray SKILL.md nested under fixtures/ must not create a second entry.
  await fs.mkdir(path.join(dir, 'fixtures'), { recursive: true });
  await fs.writeFile(path.join(dir, 'fixtures', 'SKILL.md'), '# nested fixture\n');

  const dirs = await findSkillDirs(path.join(root, 'skills'));
  assert.equal(dirs.length, 1);
});
