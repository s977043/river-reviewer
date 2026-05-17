// Ensures schemas/riverbed-index.schema.json matches what src/lib/riverbed-memory.mjs writes.
// If the index schema drifts from the v1 implementation again (see #563/#565), this test catches it.

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { loadMemory, appendEntry, supersede, expireEntries } from '../src/lib/riverbed-memory.mjs';
import { createTempMemory, makeMemoryEntry } from './helpers/memory.mjs';
import { compileRiverbedIndexValidator } from './helpers/schema-validator.mjs';

// Compiled once at module scope (ajv compile is expensive, schemas are
// static). strict mode stays on so future schema typos surface here; the
// riverbed-entry $ref wiring lives in the shared helper.
const validate = compileRiverbedIndexValidator();

describe('riverbed-index.schema.json', () => {
  test('empty index from loadMemory conforms to schema', () => {
    const { cleanup, indexPath } = createTempMemory({ layout: 'flat', prefix: 'rr-idx-' });
    try {
      const mem = loadMemory(indexPath);
      assert.equal(validate(mem), true, JSON.stringify(validate.errors, null, 2));
    } finally {
      cleanup();
    }
  });

  test('index after appendEntry conforms to schema', () => {
    const { cleanup, indexPath } = createTempMemory({ layout: 'flat', prefix: 'rr-idx-' });
    try {
      appendEntry(indexPath, makeMemoryEntry({ type: 'review' }));
      appendEntry(indexPath, makeMemoryEntry({ type: 'wontfix' }));
      const mem = loadMemory(indexPath);
      assert.equal(validate(mem), true, JSON.stringify(validate.errors, null, 2));
      assert.equal(mem.entries.length, 2);
    } finally {
      cleanup();
    }
  });

  test('index after supersede conforms to schema', () => {
    const { cleanup, indexPath } = createTempMemory({ layout: 'flat', prefix: 'rr-idx-' });
    try {
      const oldEntry = makeMemoryEntry({ id: 'old-1' });
      const newEntry = makeMemoryEntry({ id: 'new-1' });
      appendEntry(indexPath, oldEntry);
      appendEntry(indexPath, newEntry);
      supersede(indexPath, 'old-1', 'new-1');
      const mem = loadMemory(indexPath);
      assert.equal(validate(mem), true, JSON.stringify(validate.errors, null, 2));
      const superseded = mem.entries.find((e) => e.id === 'old-1');
      assert.equal(superseded.status, 'superseded');
      assert.equal(superseded.supersededBy, 'new-1');
    } finally {
      cleanup();
    }
  });

  test('index after expireEntries conforms to schema', () => {
    const { cleanup, indexPath } = createTempMemory({ layout: 'flat', prefix: 'rr-idx-' });
    try {
      appendEntry(
        indexPath,
        makeMemoryEntry({ id: 'expired-1', expiresAt: '2020-01-01T00:00:00Z' })
      );
      appendEntry(indexPath, makeMemoryEntry({ id: 'active-1' }));
      expireEntries(indexPath);
      const mem = loadMemory(indexPath);
      assert.equal(validate(mem), true, JSON.stringify(validate.errors, null, 2));
      assert.equal(mem.entries.find((e) => e.id === 'expired-1').status, 'archived');
    } finally {
      cleanup();
    }
  });

  test('missing version field is rejected', () => {
    assert.equal(validate({ entries: [] }), false);
  });

  test('extra top-level property is rejected', () => {
    assert.equal(validate({ version: '1', entries: [], unexpected: true }), false);
  });
});
