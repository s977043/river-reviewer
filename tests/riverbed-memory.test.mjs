import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadMemory, appendEntry, queryMemory } from '../src/lib/riverbed-memory.mjs';

function tmpIndex() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rr-memory-'));
  return { dir, indexPath: path.join(dir, 'index.json') };
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true });
}

function makeEntry(overrides = {}) {
  return {
    id: `test-${Date.now()}`,
    type: 'review',
    content: 'Test content',
    metadata: { createdAt: new Date().toISOString(), author: 'test' },
    ...overrides,
  };
}

test('loadMemory: returns empty structure for missing file', () => {
  const { dir, indexPath } = tmpIndex();
  const mem = loadMemory(indexPath);
  assert.deepEqual(mem.entries, []);
  assert.equal(mem.version, '1');
  cleanup(dir);
});

test('loadMemory: reads existing index', () => {
  const { dir, indexPath } = tmpIndex();
  const data = { entries: [makeEntry()], version: '1' };
  fs.writeFileSync(indexPath, JSON.stringify(data));
  const mem = loadMemory(indexPath);
  assert.equal(mem.entries.length, 1);
  cleanup(dir);
});

test('appendEntry: creates file and adds entry', () => {
  const { dir, indexPath } = tmpIndex();
  const entry = makeEntry({ id: 'e1' });
  appendEntry(indexPath, entry);
  const mem = loadMemory(indexPath);
  assert.equal(mem.entries.length, 1);
  assert.equal(mem.entries[0].id, 'e1');
  cleanup(dir);
});

test('appendEntry: rejects duplicate ID', () => {
  const { dir, indexPath } = tmpIndex();
  appendEntry(indexPath, makeEntry({ id: 'dup' }));
  assert.throws(() => appendEntry(indexPath, makeEntry({ id: 'dup' })), /Duplicate/);
  cleanup(dir);
});

test('appendEntry: rejects entry without required fields', () => {
  const { dir, indexPath } = tmpIndex();
  assert.throws(() => appendEntry(indexPath, { id: 'x' }), /must have/);
  cleanup(dir);
});

test('queryMemory: filters by type', () => {
  const entries = [
    makeEntry({ id: 'a', type: 'adr' }),
    makeEntry({ id: 'b', type: 'review' }),
    makeEntry({ id: 'c', type: 'adr' }),
  ];
  const result = queryMemory({ entries }, { type: 'adr' });
  assert.equal(result.length, 2);
});

test('queryMemory: filters by phase', () => {
  const entries = [
    makeEntry({ id: 'a', metadata: { createdAt: '', author: '', phase: 'upstream' } }),
    makeEntry({ id: 'b', metadata: { createdAt: '', author: '', phase: 'midstream' } }),
  ];
  const result = queryMemory({ entries }, { phase: 'upstream' });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'a');
});

test('queryMemory: filters by tags', () => {
  const entries = [
    makeEntry({ id: 'a', metadata: { createdAt: '', author: '', tags: ['security', 'auth'] } }),
    makeEntry({ id: 'b', metadata: { createdAt: '', author: '', tags: ['perf'] } }),
  ];
  const result = queryMemory({ entries }, { tags: ['security'] });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'a');
});

test('queryMemory: empty filter returns all', () => {
  const entries = [makeEntry({ id: 'a' }), makeEntry({ id: 'b' })];
  const result = queryMemory({ entries });
  assert.equal(result.length, 2);
});

test('queryMemory: combined filters are AND', () => {
  const entries = [
    makeEntry({
      id: 'a',
      type: 'adr',
      metadata: { createdAt: '', author: '', phase: 'upstream' },
    }),
    makeEntry({
      id: 'b',
      type: 'adr',
      metadata: { createdAt: '', author: '', phase: 'midstream' },
    }),
    makeEntry({
      id: 'c',
      type: 'review',
      metadata: { createdAt: '', author: '', phase: 'upstream' },
    }),
  ];
  const result = queryMemory({ entries }, { type: 'adr', phase: 'upstream' });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'a');
});
