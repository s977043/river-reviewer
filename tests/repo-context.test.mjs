import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { collectRepoContext, formatRepoContextPrompt } from '../src/lib/repo-context.mjs';
import { createTempDir, cleanupTempDir } from './helpers/temp-dir.mjs';

// ---------------------------------------------------------------------------
// formatRepoContextPrompt
// ---------------------------------------------------------------------------

test('formatRepoContextPrompt returns empty string for empty array', () => {
  assert.equal(formatRepoContextPrompt([]), '');
});

test('formatRepoContextPrompt returns empty string for null/undefined', () => {
  assert.equal(formatRepoContextPrompt(null), '');
  assert.equal(formatRepoContextPrompt(undefined), '');
});

test('formatRepoContextPrompt formats sections with headers', () => {
  const sections = [
    { title: 'File: src/app.ts', content: 'const x = 1;' },
    { title: 'Config: package.json', content: '{"name":"test"}' },
  ];
  const result = formatRepoContextPrompt(sections);
  assert.ok(result.includes('### Repository Context'));
  assert.ok(result.includes('#### File: src/app.ts'));
  assert.ok(result.includes('const x = 1;'));
  assert.ok(result.includes('#### Config: package.json'));
  assert.ok(result.includes('{"name":"test"}'));
});

test('formatRepoContextPrompt wraps content in code fences', () => {
  const sections = [{ title: 'File: foo.ts', content: 'export const foo = 1;' }];
  const result = formatRepoContextPrompt(sections);
  assert.ok(result.includes('```'));
  assert.ok(result.includes('export const foo = 1;'));
});

test('formatRepoContextPrompt handles section with empty content', () => {
  const sections = [{ title: 'Sibling files', content: '' }];
  const result = formatRepoContextPrompt(sections);
  assert.ok(result.includes('#### Sibling files'));
});

// ---------------------------------------------------------------------------
// collectRepoContext — guard cases
// ---------------------------------------------------------------------------

test('collectRepoContext returns empty sections when no changedFiles', async () => {
  const result = await collectRepoContext({ changedFiles: [], cwd: '/tmp' });
  assert.deepEqual(result.sections, []);
  assert.equal(result.truncated, false);
  assert.ok(typeof result.debugSummary === 'string');
});

test('collectRepoContext returns empty sections when options missing', async () => {
  const result = await collectRepoContext({});
  assert.deepEqual(result.sections, []);
});

// ---------------------------------------------------------------------------
// collectRepoContext — with a temp directory
// ---------------------------------------------------------------------------

test('collectRepoContext collects full file text', async () => {
  const dir = createTempDir({ prefix: 'river-repo-ctx-' });
  try {
    const srcDir = join(dir, 'src');
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, 'utils.ts'), 'export function hello() { return "hi"; }\n');

    const result = await collectRepoContext({
      changedFiles: ['src/utils.ts'],
      cwd: dir,
    });

    const fullSection = result.sections.find((s) => s.title === 'File: src/utils.ts');
    assert.ok(fullSection, 'should have full-text section for src/utils.ts');
    assert.ok(fullSection.content.includes('hello'));
  } finally {
    cleanupTempDir(dir);
  }
});

test('collectRepoContext collects sibling files listing', async () => {
  const dir = createTempDir({ prefix: 'river-repo-ctx-' });
  try {
    const srcDir = join(dir, 'src');
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, 'main.ts'), 'export const a = 1;\n');
    writeFileSync(join(srcDir, 'helper.ts'), 'export const b = 2;\n');

    const result = await collectRepoContext({
      changedFiles: ['src/main.ts'],
      cwd: dir,
    });

    const siblingSection = result.sections.find((s) => s.title === 'Sibling files');
    assert.ok(siblingSection, 'should have sibling files section');
    assert.ok(siblingSection.content.includes('helper.ts'));
  } finally {
    cleanupTempDir(dir);
  }
});

test('collectRepoContext finds corresponding test files', async () => {
  const dir = createTempDir({ prefix: 'river-repo-ctx-' });
  try {
    const srcDir = join(dir, 'src');
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, 'utils.ts'), 'export function add(a,b){return a+b;}\n');
    writeFileSync(
      join(srcDir, 'utils.test.ts'),
      "import {add} from './utils';\nconsole.log(add(1,2));\n"
    );

    const result = await collectRepoContext({
      changedFiles: ['src/utils.ts'],
      cwd: dir,
    });

    const testSection = result.sections.find((s) => s.title.startsWith('Test:'));
    assert.ok(testSection, 'should find test file');
    assert.ok(testSection.content.includes('add'));
  } finally {
    cleanupTempDir(dir);
  }
});

test('collectRepoContext collects config files from root', async () => {
  const dir = createTempDir({ prefix: 'river-repo-ctx-' });
  try {
    const srcDir = join(dir, 'src');
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, 'index.ts'), 'export const x = 1;\n');
    writeFileSync(join(dir, 'package.json'), '{"name":"my-pkg","version":"1.0.0"}\n');

    const result = await collectRepoContext({
      changedFiles: ['src/index.ts'],
      cwd: dir,
    });

    const configSection = result.sections.find((s) => s.title === 'Config: package.json');
    assert.ok(configSection, 'should collect package.json');
    assert.ok(configSection.content.includes('my-pkg'));
  } finally {
    cleanupTempDir(dir);
  }
});

test('collectRepoContext does not include changed file itself as sibling', async () => {
  const dir = createTempDir({ prefix: 'river-repo-ctx-' });
  try {
    const srcDir = join(dir, 'src');
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, 'main.ts'), 'export const main = true;\n');

    const result = await collectRepoContext({
      changedFiles: ['src/main.ts'],
      cwd: dir,
    });

    const siblingSection = result.sections.find((s) => s.title === 'Sibling files');
    // Either no sibling section (no siblings at all), or main.ts should not appear in it
    if (siblingSection) {
      assert.ok(
        !siblingSection.content.includes('main.ts'),
        'changed file should not be in siblings'
      );
    }
  } finally {
    cleanupTempDir(dir);
  }
});

test('collectRepoContext truncates files exceeding per-section budget', async () => {
  const dir = createTempDir({ prefix: 'river-repo-ctx-' });
  try {
    const srcDir = join(dir, 'src');
    mkdirSync(srcDir, { recursive: true });
    // Write a file larger than the fullFile budget
    const bigContent = 'x'.repeat(5000);
    writeFileSync(join(srcDir, 'big.ts'), bigContent);

    const result = await collectRepoContext({
      changedFiles: ['src/big.ts'],
      cwd: dir,
      tokenBudget: { fullFile: 100 },
    });

    const fullSection = result.sections.find((s) => s.title === 'File: src/big.ts');
    assert.ok(fullSection, 'should have full-text section');
    assert.ok(fullSection.content.includes('[truncated]'), 'content should be truncated');
    assert.ok(fullSection.content.length < 200, 'content should be short');
  } finally {
    cleanupTempDir(dir);
  }
});

test('collectRepoContext returns debugSummary string', async () => {
  const dir = createTempDir({ prefix: 'river-repo-ctx-' });
  try {
    const srcDir = join(dir, 'src');
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, 'foo.ts'), 'export const foo = 42;\n');

    const result = await collectRepoContext({
      changedFiles: ['src/foo.ts'],
      cwd: dir,
    });

    assert.ok(typeof result.debugSummary === 'string', 'debugSummary should be a string');
    assert.ok(result.debugSummary.length > 0, 'debugSummary should not be empty');
    assert.ok(result.debugSummary.includes('full-text'), 'debugSummary should mention full-text');
  } finally {
    cleanupTempDir(dir);
  }
});

test('collectRepoContext total budget triggers truncation flag', async () => {
  const dir = createTempDir({ prefix: 'river-repo-ctx-' });
  try {
    const srcDir = join(dir, 'src');
    mkdirSync(srcDir, { recursive: true });
    // Write multiple files to exceed total budget of 8000 chars
    for (let i = 0; i < 5; i++) {
      writeFileSync(join(srcDir, `file${i}.ts`), 'x'.repeat(2000));
    }

    const changedFiles = Array.from({ length: 5 }, (_, i) => `src/file${i}.ts`);
    const result = await collectRepoContext({ changedFiles, cwd: dir });

    // With 5 files at 2000 chars each plus overhead, total budget should be exceeded
    assert.equal(result.truncated, true, 'should set truncated=true when over budget');
  } finally {
    cleanupTempDir(dir);
  }
});

// ---------------------------------------------------------------------------
// buildPrompt integration: repoContext is injected into prompt
// ---------------------------------------------------------------------------

test('buildPrompt injects repoContext when provided', async () => {
  const { buildPrompt } = await import('../src/lib/review-engine.mjs');
  const diffText = `diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,0 +2,1 @@
+const value = 1;
`;
  const repoContext = {
    sections: [{ title: 'File: src/app.ts', content: 'const original = 0;' }],
    truncated: false,
    debugSummary: 'test',
  };
  const { prompt } = buildPrompt({
    diffText,
    diffFiles: [{ path: 'src/app.ts', hunks: [] }],
    plan: { selected: [] },
    phase: 'midstream',
    repoContext,
  });
  assert.ok(
    prompt.includes('Repository Context'),
    'prompt should include Repository Context section'
  );
  assert.ok(prompt.includes('File: src/app.ts'), 'prompt should include section title');
  assert.ok(prompt.includes('const original = 0;'), 'prompt should include section content');
});

test('buildPrompt omits repoContext section when not provided', async () => {
  const { buildPrompt } = await import('../src/lib/review-engine.mjs');
  const diffText = `diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,0 +2,1 @@
+const value = 1;
`;
  const { prompt } = buildPrompt({
    diffText,
    diffFiles: [{ path: 'src/app.ts', hunks: [] }],
    plan: { selected: [] },
    phase: 'midstream',
  });
  assert.ok(
    !prompt.includes('Repository Context'),
    'prompt should not include Repository Context when repoContext is absent'
  );
});
