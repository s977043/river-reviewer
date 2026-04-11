import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hashFinding,
  inferSubsystem,
  createSuppression,
  revokeSuppression,
  findActiveSuppressions,
} from '../src/lib/suppression.mjs';
import { loadMemory } from '../src/lib/riverbed-memory.mjs';
import { createTempMemory } from './helpers/memory.mjs';

function tmpIndex() {
  return createTempMemory({ layout: 'nested', prefix: 'river-supp-' });
}

test('hashFinding produces stable hash for same input', () => {
  const h1 = hashFinding({ file: 'a.ts', message: 'test', ruleId: 'r1' });
  const h2 = hashFinding({ file: 'a.ts', message: 'test', ruleId: 'r1' });
  assert.equal(h1, h2);
  assert.equal(h1.length, 16);
});

test('hashFinding produces different hash for different input', () => {
  const h1 = hashFinding({ file: 'a.ts', message: 'test' });
  const h2 = hashFinding({ file: 'b.ts', message: 'test' });
  assert.notEqual(h1, h2);
});

test('inferSubsystem extracts correct subsystem', () => {
  assert.equal(inferSubsystem('src/auth/handler.ts'), 'auth');
  assert.equal(inferSubsystem('src/lib/utils.mjs'), 'lib');
  assert.equal(inferSubsystem('runners/core/loader.mjs'), 'runners');
  assert.equal(inferSubsystem('file.ts'), '');
});

test('createSuppression creates valid entry', () => {
  const { cleanup, indexPath } = tmpIndex();
  try {
    const entry = createSuppression({
      indexPath,
      findingId: 'f1',
      findingHash: 'abc123',
      filePaths: ['src/auth.ts'],
      rationale: 'Accepted for now',
      scope: 'file',
      author: 'tester',
    });
    assert.equal(entry.type, 'suppression');
    assert.ok(entry.id.startsWith('suppression-abc123-'));
    assert.equal(entry.content, 'Accepted for now');
    assert.ok(entry.metadata.tags.includes('active'));
    assert.ok(entry.context.active);
    const index = loadMemory(indexPath);
    assert.equal(index.entries.length, 1);
  } finally {
    cleanup();
  }
});

test('createSuppression rejects missing rationale', () => {
  const { cleanup, indexPath } = tmpIndex();
  try {
    assert.throws(() => createSuppression({ indexPath, filePaths: ['a.ts'] }), /rationale/);
  } finally {
    cleanup();
  }
});

test('revokeSuppression appends resurface entry', () => {
  const { cleanup, indexPath } = tmpIndex();
  try {
    createSuppression({
      indexPath,
      findingId: 'f1',
      findingHash: 'h1',
      filePaths: ['a.ts'],
      rationale: 'ok',
    });
    const entry = revokeSuppression(indexPath, 'suppression-h1-123', {
      reason: 'no longer valid',
    });
    assert.equal(entry.type, 'resurface');
    assert.equal(entry.context.action, 'revoke');
    const index = loadMemory(indexPath);
    assert.equal(index.entries.length, 2);
  } finally {
    cleanup();
  }
});

test('findActiveSuppressions matches by file path', () => {
  const index = {
    entries: [
      {
        id: 's1',
        type: 'suppression',
        content: 'ok',
        metadata: { createdAt: '2026-01-01T00:00:00Z', author: 't', relatedFiles: ['src/auth.ts'] },
        context: { active: true, scope: 'file' },
      },
      {
        id: 's2',
        type: 'suppression',
        content: 'ok',
        metadata: {
          createdAt: '2026-01-01T00:00:00Z',
          author: 't',
          relatedFiles: ['src/billing.ts'],
        },
        context: { active: true, scope: 'file' },
      },
    ],
  };
  const result = findActiveSuppressions(index, ['src/auth.ts']);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 's1');
});

test('findActiveSuppressions excludes revoked suppressions', () => {
  const index = {
    entries: [
      {
        id: 's1',
        type: 'suppression',
        content: 'ok',
        metadata: { createdAt: '2026-01-01T00:00:00Z', author: 't', relatedFiles: ['src/auth.ts'] },
        context: { active: true, scope: 'file' },
      },
      {
        id: 'r1',
        type: 'resurface',
        content: 'revoked',
        metadata: { createdAt: '2026-01-02T00:00:00Z', author: 't' },
        context: { suppressionId: 's1', action: 'revoke' },
      },
    ],
  };
  const result = findActiveSuppressions(index, ['src/auth.ts']);
  assert.equal(result.length, 0);
});

test('findActiveSuppressions excludes expired suppressions', () => {
  const index = {
    entries: [
      {
        id: 's1',
        type: 'suppression',
        content: 'ok',
        metadata: { createdAt: '2024-01-01T00:00:00Z', author: 't', relatedFiles: ['src/auth.ts'] },
        context: { active: true, scope: 'file', expiresAt: '2025-01-01T00:00:00Z' },
      },
    ],
  };
  const result = findActiveSuppressions(index, ['src/auth.ts']);
  assert.equal(result.length, 0);
});

test('findActiveSuppressions matches subsystem scope', () => {
  const index = {
    entries: [
      {
        id: 's1',
        type: 'suppression',
        content: 'ok',
        metadata: {
          createdAt: '2026-01-01T00:00:00Z',
          author: 't',
          relatedFiles: ['src/auth/login.ts'],
        },
        context: { active: true, scope: 'subsystem' },
      },
    ],
  };
  const result = findActiveSuppressions(index, ['src/auth/oauth.ts']);
  assert.equal(result.length, 1);
});
