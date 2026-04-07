import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { findRelatedADRs } from '../src/lib/adr-linker.mjs';

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
  const results = findRelatedADRs(ROOT, { keywords: ['river reviewer'] });
  const fromExplanation = results.find((r) => r.path.startsWith('pages/explanation/'));
  assert.ok(fromExplanation, 'should find at least one doc in pages/explanation/');
});
