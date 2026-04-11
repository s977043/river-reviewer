import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import test from 'node:test';

import {
  createTempMemory,
  makeMemoryEntry,
  writeMemoryIndex,
} from '../memory.mjs';

test('createTempMemory (nested) creates .river/memory/ structure', () => {
  const { dir, indexPath, cleanup } = createTempMemory({ layout: 'nested' });
  try {
    assert.match(indexPath, /\.river[\\/]memory[\\/]index\.json$/);
    assert.ok(existsSync(dirname(indexPath)));
    // index.json はまだ書き込まれていない（entries 未指定）
    assert.ok(!existsSync(indexPath));
  } finally {
    cleanup();
  }
});

test('createTempMemory (flat) places index.json directly in the dir', () => {
  const { dir, indexPath, cleanup } = createTempMemory({ layout: 'flat' });
  try {
    assert.equal(dirname(indexPath), dir);
  } finally {
    cleanup();
  }
});

test('createTempMemory writes provided entries to index.json', () => {
  const entry = makeMemoryEntry({ id: 'seed-1', type: 'review', content: 'seed' });
  const { indexPath, cleanup } = createTempMemory({
    layout: 'nested',
    entries: [entry],
  });
  try {
    const parsed = JSON.parse(readFileSync(indexPath, 'utf8'));
    assert.equal(parsed.entries.length, 1);
    assert.equal(parsed.entries[0].id, 'seed-1');
    assert.equal(parsed.version, '1');
  } finally {
    cleanup();
  }
});

test('makeMemoryEntry produces unique ids on repeated calls', () => {
  const a = makeMemoryEntry();
  const b = makeMemoryEntry();
  assert.notEqual(a.id, b.id);
  assert.equal(a.type, 'review');
  assert.ok(a.metadata.createdAt);
  assert.equal(a.metadata.author, 'test');
});

test('makeMemoryEntry merges metadata overrides without dropping defaults', () => {
  const entry = makeMemoryEntry({
    metadata: { phase: 'upstream', tags: ['security'] },
  });
  assert.equal(entry.metadata.phase, 'upstream');
  assert.deepEqual(entry.metadata.tags, ['security']);
  assert.ok(entry.metadata.createdAt); // default preserved
  assert.equal(entry.metadata.author, 'test'); // default preserved
});

test('writeMemoryIndex overwrites the index file with given entries', () => {
  const { indexPath, cleanup } = createTempMemory({ layout: 'flat' });
  try {
    writeMemoryIndex(indexPath, [makeMemoryEntry({ id: 'a' })]);
    const first = JSON.parse(readFileSync(indexPath, 'utf8'));
    assert.equal(first.entries.length, 1);

    writeMemoryIndex(indexPath, [
      makeMemoryEntry({ id: 'b' }),
      makeMemoryEntry({ id: 'c' }),
    ]);
    const second = JSON.parse(readFileSync(indexPath, 'utf8'));
    assert.equal(second.entries.length, 2);
    assert.equal(second.entries[0].id, 'b');
  } finally {
    cleanup();
  }
});
