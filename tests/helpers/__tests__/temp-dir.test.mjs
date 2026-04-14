import assert from 'node:assert/strict';
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  createTempDir,
  createTempDirAsync,
  cleanupTempDir,
  cleanupTempDirAsync,
  withTempDir,
} from '../temp-dir.mjs';

test('createTempDir returns an existing directory path', () => {
  const dir = createTempDir();
  try {
    assert.equal(typeof dir, 'string');
    assert.ok(existsSync(dir));
    assert.ok(statSync(dir).isDirectory());
  } finally {
    cleanupTempDir(dir);
  }
});

test('createTempDir honors prefix option', () => {
  const dir = createTempDir({ prefix: 'custom-prefix-' });
  try {
    assert.match(dir, /custom-prefix-/);
  } finally {
    cleanupTempDir(dir);
  }
});

test('cleanupTempDir removes the directory and nested files', () => {
  const dir = createTempDir();
  writeFileSync(join(dir, 'nested.txt'), 'hello');
  assert.ok(existsSync(join(dir, 'nested.txt')));
  cleanupTempDir(dir);
  assert.ok(!existsSync(dir));
});

test('withTempDir auto-cleans the directory on success', async () => {
  let capturedDir;
  const result = await withTempDir(async (dir) => {
    capturedDir = dir;
    writeFileSync(join(dir, 'touch.txt'), 'x');
    return 42;
  });
  assert.equal(result, 42);
  assert.ok(capturedDir);
  assert.ok(!existsSync(capturedDir));
});

test('withTempDir auto-cleans the directory when callback throws', async () => {
  let capturedDir;
  await assert.rejects(
    withTempDir(async (dir) => {
      capturedDir = dir;
      throw new Error('boom');
    }),
    /boom/,
  );
  assert.ok(capturedDir);
  assert.ok(!existsSync(capturedDir));
});

test('createTempDirAsync + cleanupTempDirAsync roundtrip', async () => {
  const dir = await createTempDirAsync({ prefix: 'async-' });
  assert.ok(existsSync(dir));
  await cleanupTempDirAsync(dir);
  assert.ok(!existsSync(dir));
});
