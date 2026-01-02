import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { createSkillValidator, defaultPaths, loadSchema, loadSkillFile, loadSkills } from '../runners/core/skill-loader.mjs';

async function buildValidator(schemaPath = defaultPaths.schemaPath) {
  const schema = await loadSchema(schemaPath);
  return createSkillValidator(schema);
}

async function withTempDir(fn) {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'skill-loader-'));
  try {
    return await fn(tmpDir);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

test('loads existing sample skill and applies default outputKind', async () => {
  const validator = await buildValidator();
  const skillPath = path.join(defaultPaths.skillsDir, 'upstream/sample-architecture-review.md');
  const loaded = await loadSkillFile(skillPath, { validator });

  assert.equal(loaded.metadata.id, 'rr-upstream-architecture-sample-001');
  assert.equal(loaded.metadata.category, 'upstream');
  assert.deepEqual(loaded.metadata.outputKind, ['findings', 'summary', 'questions', 'actions']);
  assert.ok(loaded.body.trim().length > 0);
});

test('loads skill with extended metadata fields', async () => {
  const validator = await buildValidator();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'skill-loader-'));
  const skillPath = path.join(tmpDir, 'with-extensions.md');
  const content = `---
id: rr-downstream-newmeta-001
name: 'Extended Metadata Skill'
description: 'Uses new metadata fields for loader'
category: downstream
phase: downstream
applyTo:
  - 'src/**/*.ts'
inputContext:
  - diff
  - commitMessage
outputKind:
  - summary
  - actions
modelHint: high-accuracy
dependencies:
  - code_search
  - custom:embedding
---
Body content
`;
  await writeFile(skillPath, content, 'utf8');

  const loaded = await loadSkillFile(skillPath, { validator });
  assert.equal(loaded.metadata.category, 'downstream');
  assert.deepEqual(loaded.metadata.inputContext, ['diff', 'commitMessage']);
  assert.deepEqual(loaded.metadata.outputKind, ['summary', 'actions']);
  assert.equal(loaded.metadata.modelHint, 'high-accuracy');
  assert.deepEqual(loaded.metadata.dependencies, ['code_search', 'custom:embedding']);
});

test('loads skill with trigger container and normalizes phase/applyTo', async () => {
  const validator = await buildValidator();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'skill-loader-'));
  const skillPath = path.join(tmpDir, 'with-trigger.md');
  const content = `---
id: rr-midstream-trigger-001
name: 'Trigger Skill'
description: 'Uses trigger container for activation'
category: midstream
trigger:
  phase: midstream
  files:
    - 'src/**/*.ts'
---
Body content
`;
  await writeFile(skillPath, content, 'utf8');

  const loaded = await loadSkillFile(skillPath, { validator });
  assert.equal(loaded.metadata.phase, 'midstream');
  assert.deepEqual(loaded.metadata.applyTo, ['src/**/*.ts']);
});

test('trigger does not override top-level phase/applyTo', async () => {
  const validator = await buildValidator();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'skill-loader-'));
  const skillPath = path.join(tmpDir, 'with-trigger-precedence.md');
  const content = `---
id: rr-midstream-trigger-002
name: 'Trigger Precedence Skill'
description: 'Top-level values win over trigger'
category: midstream
phase: midstream
applyTo:
  - 'src/**/*.ts'
trigger:
  phase: upstream
  applyTo:
    - 'should-not-win/**'
---
Body content
`;
  await writeFile(skillPath, content, 'utf8');

  const loaded = await loadSkillFile(skillPath, { validator });
  assert.equal(loaded.metadata.phase, 'midstream');
  assert.deepEqual(loaded.metadata.applyTo, ['src/**/*.ts']);
  assert.strictEqual(loaded.metadata.trigger, undefined);
});

test('normalizes path_patterns aliases and prefers category for phase resolution', async () => {
  const validator = await buildValidator();
  await withTempDir(async tmpDir => {
    const skillPath = path.join(tmpDir, 'with-path-patterns.md');
    const content = `---
id: rr-midstream-path-patterns-001
name: 'Path Pattern Skill'
description: 'Uses path_patterns aliases'
category: midstream
path_patterns:
  - 'src/**/*'
trigger:
  phase: upstream
  path_patterns:
    - 'docs/**/*.md'
---
Body content
`;
    await writeFile(skillPath, content, 'utf8');

    const loaded = await loadSkillFile(skillPath, { validator });
    assert.equal(loaded.metadata.category, 'midstream');
    assert.equal(loaded.metadata.phase, 'midstream');
    assert.deepEqual(loaded.metadata.applyTo, ['src/**/*']);
  });
});

test('derives category from phase and trigger paths when category is missing', async () => {
  const validator = await buildValidator();
  await withTempDir(async tmpDir => {
    const skillPath = path.join(tmpDir, 'derive-category.md');
    const content = `---
id: rr-core-derived-001
name: 'Derived Category Skill'
description: 'Relies on trigger for applyTo'
phase:
  - upstream
  - midstream
  - downstream
trigger:
  phase: downstream
  path_patterns:
    - 'tests/**/*.ts'
---
Body content
`;
    await writeFile(skillPath, content, 'utf8');

    const loaded = await loadSkillFile(skillPath, { validator });
    assert.equal(loaded.metadata.category, 'core');
    assert.deepEqual(loaded.metadata.phase, ['upstream', 'midstream', 'downstream']);
    assert.deepEqual(loaded.metadata.applyTo, ['tests/**/*.ts']);
  });
});

test('fails when dependencies contain unsupported values', async () => {
  const validator = await buildValidator();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'skill-loader-'));
  const skillPath = path.join(tmpDir, 'invalid-deps.md');
  const content = `---
id: rr-upstream-invalid-deps-001
name: 'Invalid deps'
description: 'Contains unsupported dependency'
phase: upstream
applyTo:
  - 'src/**/*.ts'
dependencies:
  - unknown_tool
---
`;
  await writeFile(skillPath, content, 'utf8');

  await assert.rejects(
    loadSkillFile(skillPath, { validator }),
    err => {
      assert.match(err.message, /validation failed/i);
      return true;
    }
  );
});

test('fails validation when required fields are missing', async () => {
  const validator = await buildValidator();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'skill-loader-'));
  const skillPath = path.join(tmpDir, 'invalid-skill.md');
  const content = `---
id: rr-upstream-missing-applyto-001
name: 'Invalid Skill'
description: 'Missing applyTo field'
phase: upstream
---
Body
`;
  await writeFile(skillPath, content, 'utf8');

  await assert.rejects(
    loadSkillFile(skillPath, { validator }),
    err => {
      assert.match(err.message, /applyTo/i);
      return true;
    }
  );
});

test('loadSkills skips files that fail validation and continues', async () => {
  await withTempDir(async tmpDir => {
    const validator = await buildValidator();
    const validPath = path.join(tmpDir, 'valid.md');
    const invalidPath = path.join(tmpDir, 'invalid.md');
    await writeFile(
      validPath,
      `---
id: rr-test-valid-001
name: Valid Skill
description: Valid metadata
phase: upstream
applyTo:
  - 'src/**/*.ts'
---
Valid body
`
    );
    await writeFile(
      invalidPath,
      `---
id: rr-test-invalid-001
name: Invalid Skill
description: Missing applyTo
phase: upstream
---
Body
`
    );

    const errors = [];
    const originalError = console.error;
    console.error = (...args) => errors.push(args.join(' '));
    try {
      const loaded = await loadSkills({ skillsDir: tmpDir, validator });
      assert.equal(loaded.length, 1);
      assert.equal(loaded[0].metadata.id, 'rr-test-valid-001');
      assert.ok(errors.some(line => line.includes('Failed to load skill')));
    } finally {
      console.error = originalError;
    }
  });
});

test('loadSkills prefers the first file when duplicate ids are found', async () => {
  await withTempDir(async tmpDir => {
    const validator = await buildValidator();
    const firstPath = path.join(tmpDir, 'a-first.md');
    const secondPath = path.join(tmpDir, 'b-second.md');
    await writeFile(
      firstPath,
      `---
id: rr-test-dup-001
name: First copy
description: First version
phase: midstream
applyTo:
  - 'src/**/*.ts'
---
First body
`
    );
    await writeFile(
      secondPath,
      `---
id: rr-test-dup-001
name: Second copy
description: Second version
phase: midstream
applyTo:
  - 'src/**/*.ts'
---
Second body
`
    );

    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));
    try {
      const loaded = await loadSkills({ skillsDir: tmpDir, validator });
      assert.equal(loaded.length, 1);
      assert.equal(loaded[0].metadata.name, 'First copy');
      assert.ok(warnings.some(line => line.includes('Duplicate skill id "rr-test-dup-001"')));
    } finally {
      console.warn = originalWarn;
    }
  });
});

test('loadSkills excludes skills with filtered tags by default', async () => {
  await withTempDir(async tmpDir => {
    const validator = await buildValidator();
    const keptPath = path.join(tmpDir, 'kept.md');
    const agentPath = path.join(tmpDir, 'agent.md');
    await writeFile(
      keptPath,
      `---
id: rr-test-keep-001
name: Kept Skill
description: Visible skill
phase: midstream
applyTo:
  - 'src/**/*.ts'
---
Body
`
    );
    await writeFile(
      agentPath,
      `---
id: rr-test-agent-001
name: Agent Skill
description: Should be excluded by default
phase: midstream
applyTo:
  - 'src/**/*.ts'
tags: [agent]
---
Agent body
`
    );

    const defaultLoaded = await loadSkills({ skillsDir: tmpDir, validator });
    assert.equal(defaultLoaded.length, 1);
    assert.equal(defaultLoaded[0].metadata.id, 'rr-test-keep-001');

    const allLoaded = await loadSkills({ skillsDir: tmpDir, validator, excludedTags: [] });
    const ids = allLoaded.map(s => s.metadata.id);
    assert.deepEqual(ids.sort(), ['rr-test-agent-001', 'rr-test-keep-001']);
  });
});

test('loadSkills loads all skill files under default directory', async () => {
  const validator = await buildValidator();
  const loaded = await loadSkills({ validator });
  assert.ok(loaded.length >= 3);
  for (const skill of loaded) {
    assert.ok(Array.isArray(skill.metadata.outputKind));
    assert.ok(skill.metadata.outputKind.length >= 1);
  }
});
