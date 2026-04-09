import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mkdtempSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { loadReviewMemory, formatMemoryForPrompt, buildReviewEntry } from '../src/lib/memory-context.mjs';

function createTempDir() { return mkdtempSync(path.join(tmpdir(), 'river-mem-ctx-')); }
function writeIndex(dir, entries) {
  const memDir = path.join(dir, '.river', 'memory');
  fs.mkdirSync(memDir, { recursive: true });
  fs.writeFileSync(path.join(memDir, 'index.json'), JSON.stringify({ entries, version: '1' }, null, 2));
}
function makeEntry(overrides = {}) {
  return { id: 'test-' + Date.now() + '-' + Math.random().toString(36).slice(2,6), type: 'review', content: 'test', metadata: { createdAt: new Date().toISOString(), author: 'test' }, ...overrides };
}

test('loadReviewMemory returns empty buckets when index missing', () => {
  const dir = createTempDir();
  try {
    const ctx = loadReviewMemory(dir);
    assert.deepEqual(ctx.entries, []);
    assert.deepEqual(ctx.wontfixes, []);
    assert.deepEqual(ctx.patterns, []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('loadReviewMemory buckets entries by type', () => {
  const dir = createTempDir();
  try {
    writeIndex(dir, [makeEntry({id:'w1',type:'wontfix'}), makeEntry({id:'p1',type:'pattern'}), makeEntry({id:'d1',type:'decision'}), makeEntry({id:'r1',type:'review'})]);
    const ctx = loadReviewMemory(dir);
    assert.equal(ctx.entries.length, 4);
    assert.equal(ctx.wontfixes.length, 1);
    assert.equal(ctx.patterns.length, 1);
    assert.equal(ctx.decisions.length, 1);
    assert.equal(ctx.reviews.length, 1);
    assert.equal(ctx.suppressions.length, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('loadReviewMemory filters by phase', () => {
  const dir = createTempDir();
  try {
    writeIndex(dir, [
      makeEntry({id:'u1',type:'pattern',metadata:{createdAt:'2026-01-01T00:00:00Z',author:'t',phase:'upstream'}}),
      makeEntry({id:'m1',type:'pattern',metadata:{createdAt:'2026-01-01T00:00:00Z',author:'t',phase:'midstream'}}),
    ]);
    const ctx = loadReviewMemory(dir, { phase: 'midstream' });
    assert.equal(ctx.entries.length, 1);
    assert.equal(ctx.entries[0].id, 'm1');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('loadReviewMemory filters by relatedFiles overlap', () => {
  const dir = createTempDir();
  try {
    writeIndex(dir, [
      makeEntry({id:'a1',type:'wontfix',metadata:{createdAt:'2026-01-01T00:00:00Z',author:'t',relatedFiles:['src/auth.ts']}}),
      makeEntry({id:'b1',type:'wontfix',metadata:{createdAt:'2026-01-01T00:00:00Z',author:'t',relatedFiles:['src/billing.ts']}}),
    ]);
    const ctx = loadReviewMemory(dir, { changedFiles: ['src/auth.ts'] });
    assert.equal(ctx.wontfixes.length, 1);
    assert.equal(ctx.wontfixes[0].id, 'a1');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('loadReviewMemory includes entries without relatedFiles', () => {
  const dir = createTempDir();
  try {
    writeIndex(dir, [
      makeEntry({id:'nr1',type:'pattern',metadata:{createdAt:'2026-01-01T00:00:00Z',author:'t'}}),
      makeEntry({id:'r1',type:'pattern',metadata:{createdAt:'2026-01-01T00:00:00Z',author:'t',relatedFiles:['unrelated.ts']}}),
    ]);
    const ctx = loadReviewMemory(dir, { changedFiles: ['src/app.ts'] });
    assert.equal(ctx.patterns.length, 1);
    assert.equal(ctx.patterns[0].id, 'nr1');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('formatMemoryForPrompt returns empty string for empty context', () => {
  assert.equal(formatMemoryForPrompt({ entries:[], wontfixes:[], patterns:[], decisions:[], reviews:[], suppressions:[] }), '');
});

test('formatMemoryForPrompt returns empty string for null', () => {
  assert.equal(formatMemoryForPrompt(null), '');
});

test('formatMemoryForPrompt formats wontfix entries', () => {
  const text = formatMemoryForPrompt({ wontfixes:[{id:'wf1',title:'Accepted logging',content:''}], patterns:[], decisions:[] });
  assert.ok(text.includes('受け入れ済み'));
  assert.ok(text.includes('wf1'));
});

test('formatMemoryForPrompt formats pattern entries', () => {
  const text = formatMemoryForPrompt({ wontfixes:[], patterns:[{id:'p1',title:'Use pure functions',content:''}], decisions:[] });
  assert.ok(text.includes('チーム規約'));
  assert.ok(text.includes('Use pure functions'));
});

test('formatMemoryForPrompt truncates to maxChars', () => {
  const ctx = { wontfixes: Array.from({length:50},(_,i)=>({id:'wf'+i,title:'Long entry '+i+' padding text here',content:''})), patterns:[], decisions:[] };
  const text = formatMemoryForPrompt(ctx, { maxChars: 200 });
  assert.ok(text.length <= 215);
  assert.ok(text.includes('[truncated]'));
});

test('buildReviewEntry returns valid entry structure', () => {
  const entry = buildReviewEntry({ comments:[{file:'a.ts',line:1,message:'test'}] }, { phase:'midstream', changedFiles:['a.ts'], commit:'abc123' });
  assert.equal(entry.type, 'review');
  assert.ok(entry.id.startsWith('review-abc123-'));
  assert.equal(entry.metadata.author, 'river-reviewer');
  assert.equal(entry.metadata.phase, 'midstream');
  assert.deepEqual(entry.metadata.relatedFiles, ['a.ts']);
});

test('buildReviewEntry uses unknown when no commit', () => {
  const entry = buildReviewEntry({ comments:[] }, {});
  assert.ok(entry.id.startsWith('review-unknown-'));
});
