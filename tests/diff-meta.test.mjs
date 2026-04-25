import assert from 'node:assert/strict';
import test from 'node:test';
import { extractDiffMeta } from '../src/lib/diff-meta.mjs';

const makeFile = (path, addedLines, removedLines) => ({
  path,
  hunks: [
    {
      lines: [
        ...Array.from({ length: addedLines }, () => '+line'),
        ...Array.from({ length: removedLines }, () => '-line'),
      ],
    },
  ],
});

test('extractDiffMeta: computes fileCount and changedLines from files', () => {
  const diff = {
    files: [makeFile('src/foo.ts', 5, 3), makeFile('src/bar.ts', 2, 1)],
    changedFiles: ['src/foo.ts', 'src/bar.ts'],
  };
  const meta = extractDiffMeta(diff);
  assert.equal(meta.fileCount, 2);
  assert.equal(meta.changedLines, 11);
});

test('extractDiffMeta: falls back to diffText when files is empty', () => {
  const diff = {
    files: [],
    changedFiles: ['src/foo.ts'],
    diffText: '+added line\n-removed line\n context line\n+++ b/src/foo.ts\n--- a/src/foo.ts',
  };
  const meta = extractDiffMeta(diff);
  assert.equal(meta.fileCount, 1);
  assert.equal(meta.changedLines, 2);
});

test('extractDiffMeta: hasTests is true when test files present', () => {
  const diff = {
    files: [makeFile('tests/foo.test.mjs', 1, 0)],
    changedFiles: ['tests/foo.test.mjs'],
  };
  const meta = extractDiffMeta(diff);
  assert.equal(meta.hasTests, true);
  assert.equal(meta.hasMigrations, false);
  assert.equal(meta.hasSchemas, false);
});

test('extractDiffMeta: hasMigrations is true when migration file present', () => {
  const diff = {
    files: [makeFile('db/migrations/001_create_users.sql', 10, 0)],
    changedFiles: ['db/migrations/001_create_users.sql'],
  };
  const meta = extractDiffMeta(diff);
  assert.equal(meta.hasMigrations, true);
  assert.equal(meta.hasSchemas, false);
});

test('extractDiffMeta: hasSchemas is true when schema file present', () => {
  const diff = {
    files: [makeFile('schemas/output.schema.json', 5, 0)],
    changedFiles: ['schemas/output.schema.json'],
  };
  const meta = extractDiffMeta(diff);
  assert.equal(meta.hasSchemas, true);
  assert.equal(meta.hasMigrations, false);
});

test('extractDiffMeta: empty diff returns zeros', () => {
  const meta = extractDiffMeta({ files: [], changedFiles: [] });
  assert.equal(meta.fileCount, 0);
  assert.equal(meta.changedLines, 0);
  assert.equal(meta.hasTests, false);
  assert.equal(meta.hasMigrations, false);
  assert.equal(meta.hasSchemas, false);
});

test('extractDiffMeta: derives changedFiles from files when not provided', () => {
  const diff = {
    files: [makeFile('src/app.ts', 3, 2)],
  };
  const meta = extractDiffMeta(diff);
  assert.equal(meta.fileCount, 1);
  assert.equal(meta.changedLines, 5);
});
