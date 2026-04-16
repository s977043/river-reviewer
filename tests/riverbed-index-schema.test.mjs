// Ensures schemas/riverbed-index.schema.json matches what src/lib/riverbed-memory.mjs writes.
// If the index schema drifts from the v1 implementation again (see #563/#565), this test catches it.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import test, { describe } from 'node:test';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import { loadMemory, appendEntry, supersede, expireEntries } from '../src/lib/riverbed-memory.mjs';
import { createTempMemory, makeMemoryEntry } from './helpers/memory.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexSchemaPath = resolve(__dirname, '..', 'schemas', 'riverbed-index.schema.json');
const entrySchemaPath = resolve(__dirname, '..', 'schemas', 'riverbed-entry.schema.json');
const indexSchema = JSON.parse(readFileSync(indexSchemaPath, 'utf8'));
const entrySchema = JSON.parse(readFileSync(entrySchemaPath, 'utf8'));

// Compile the schema once — ajv compile is expensive and the schemas are static.
// strict mode stays on so future schema typos / unknown keywords surface here.
const validate = (() => {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  // The index schema references riverbed-entry.schema.json via relative $ref,
  // which ajv resolves against the index schema's $id. Resolve the entry
  // schema URL from $id so a future $id change does not silently break this.
  const entryRefId = new URL('./riverbed-entry.schema.json', indexSchema.$id).toString();
  ajv.addSchema(entrySchema, entryRefId);
  return ajv.compile(indexSchema);
})();

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
