import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { findRelatedADRs } from '../src/lib/adr-linker.mjs';
import { withTempDir } from './helpers/temp-dir.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('findRelatedADRs matches ADR by keyword', () => {
  const results = findRelatedADRs(ROOT, { keywords: ['evaluation'] });
  assert.ok(results.length > 0, 'should find at least one ADR');
  const adr001 = results.find((r) => r.path.includes('001-eval-driven-improvement-loop'));
  assert.ok(adr001, 'should find ADR-001');
  assert.equal(adr001.matchReason, 'keyword: evaluation');
});

test('findRelatedADRs returns empty for non-existent keyword', () => {
  const results = findRelatedADRs(ROOT, { keywords: ['xyznonexistent'] });
  assert.equal(results.length, 0);
});

test('findRelatedADRs matches by changedFiles when file is referenced in ADR', () => {
  // ADR-001 mentions artifacts/evals/results.jsonl
  const results = findRelatedADRs(ROOT, {
    changedFiles: ['artifacts/evals/results.jsonl'],
  });
  assert.ok(results.length > 0, 'should find at least one match');
  const adr001 = results.find((r) => r.path.includes('001-eval-driven-improvement-loop'));
  assert.ok(adr001, 'should find ADR-001 via file reference');
  assert.match(adr001.matchReason, /references:/);
});

test('findRelatedADRs does not duplicate when both keyword and file match', () => {
  const results = findRelatedADRs(ROOT, {
    keywords: ['evaluation'],
    changedFiles: ['artifacts/evals/results.jsonl'],
  });
  const adr001Matches = results.filter((r) => r.path.includes('001-eval-driven-improvement-loop'));
  // Should appear only once (keyword match takes priority)
  assert.equal(adr001Matches.length, 1);
});

test('findRelatedADRs returns empty with no options', () => {
  const results = findRelatedADRs(ROOT);
  assert.equal(results.length, 0);
});

test('findRelatedADRs scans pages/explanation directory', () => {
  // pages/explanation/ has design-philosophy.md etc.
  const results = findRelatedADRs(ROOT, { keywords: ['river review'] });
  const fromExplanation = results.find((r) => r.path.startsWith('pages/explanation/'));
  assert.ok(fromExplanation, 'should find at least one doc in pages/explanation/');
});

test('findRelatedADRs scans extraDirs (review.specDirs) beyond the defaults', async () => {
  await withTempDir(
    async (dir) => {
      const specDir = path.join(dir, 'docs', 'product-specs');
      mkdirSync(specDir, { recursive: true });
      writeFileSync(
        path.join(specDir, 'billing.md'),
        '# Billing Spec\n\nGoverns app/Services/Billing/Charge.ts behavior.'
      );

      // Without extraDirs the custom dir is not scanned.
      const none = findRelatedADRs(dir, { changedFiles: ['app/Services/Billing/Charge.ts'] });
      assert.equal(none.length, 0);

      // With extraDirs the spec is linked by file reference.
      const found = findRelatedADRs(dir, {
        changedFiles: ['app/Services/Billing/Charge.ts'],
        extraDirs: ['docs/product-specs'],
      });
      const spec = found.find((r) => r.path === 'docs/product-specs/billing.md');
      assert.ok(spec, 'custom spec dir should be scanned via extraDirs');
      assert.match(spec.matchReason, /references:/);
    },
    { prefix: 'adr-linker-' }
  );
});

test('findRelatedADRs ignores extraDirs that escape the repo root (path traversal)', async () => {
  await withTempDir(
    async (dir) => {
      const results = findRelatedADRs(dir, {
        changedFiles: ['app/x.ts'],
        extraDirs: ['../', '../../', '/etc'],
      });
      assert.deepEqual(results, []);
    },
    { prefix: 'adr-linker-' }
  );
});

test('findRelatedADRs skips a configured path that is a file, not a directory', async () => {
  await withTempDir(
    async (dir) => {
      mkdirSync(path.join(dir, 'docs'), { recursive: true });
      writeFileSync(path.join(dir, 'docs', 'notes.md'), 'plain file, not a dir');
      const results = findRelatedADRs(dir, {
        changedFiles: ['app/x.ts'],
        extraDirs: ['docs/notes.md'],
      });
      assert.deepEqual(results, []);
    },
    { prefix: 'adr-linker-' }
  );
});
