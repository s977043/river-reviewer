import assert from 'node:assert/strict';
import test from 'node:test';
import { determineReviewMode, getReviewDepthConfig } from '../src/lib/review-plan-generator.mjs';

// --- determineReviewMode ---

test('determineReviewMode: tiny when fileCount <= 3 and changedLines <= 100', () => {
  assert.equal(determineReviewMode({ fileCount: 1, changedLines: 50, hasMigrations: false, hasSchemas: false }), 'tiny');
  assert.equal(determineReviewMode({ fileCount: 3, changedLines: 100, hasMigrations: false, hasSchemas: false }), 'tiny');
});

test('determineReviewMode: large when fileCount > 20', () => {
  assert.equal(determineReviewMode({ fileCount: 21, changedLines: 50, hasMigrations: false, hasSchemas: false }), 'large');
});

test('determineReviewMode: large when changedLines > 800', () => {
  assert.equal(determineReviewMode({ fileCount: 5, changedLines: 801, hasMigrations: false, hasSchemas: false }), 'large');
});

test('determineReviewMode: medium otherwise', () => {
  assert.equal(determineReviewMode({ fileCount: 10, changedLines: 400, hasMigrations: false, hasSchemas: false }), 'medium');
  assert.equal(determineReviewMode({ fileCount: 4, changedLines: 101, hasMigrations: false, hasSchemas: false }), 'medium');
});

test('determineReviewMode: migration upgrades tiny to medium', () => {
  assert.equal(determineReviewMode({ fileCount: 1, changedLines: 10, hasMigrations: true, hasSchemas: false }), 'medium');
});

test('determineReviewMode: migration upgrades medium to large', () => {
  assert.equal(determineReviewMode({ fileCount: 10, changedLines: 400, hasMigrations: true, hasSchemas: false }), 'large');
});

test('determineReviewMode: schema upgrades tiny to medium', () => {
  assert.equal(determineReviewMode({ fileCount: 1, changedLines: 5, hasMigrations: false, hasSchemas: true }), 'medium');
});

test('determineReviewMode: schema upgrades medium to large', () => {
  assert.equal(determineReviewMode({ fileCount: 10, changedLines: 400, hasMigrations: false, hasSchemas: true }), 'large');
});

test('determineReviewMode: large stays large even with migration', () => {
  assert.equal(determineReviewMode({ fileCount: 25, changedLines: 900, hasMigrations: true, hasSchemas: false }), 'large');
});

test('determineReviewMode: boundary fileCount=3, changedLines=101 is medium', () => {
  assert.equal(determineReviewMode({ fileCount: 3, changedLines: 101, hasMigrations: false, hasSchemas: false }), 'medium');
});

test('determineReviewMode: boundary fileCount=4, changedLines=100 is medium', () => {
  assert.equal(determineReviewMode({ fileCount: 4, changedLines: 100, hasMigrations: false, hasSchemas: false }), 'medium');
});

// --- getReviewDepthConfig ---

test('getReviewDepthConfig: tiny returns maxFindings=3', () => {
  const cfg = getReviewDepthConfig('tiny');
  assert.equal(cfg.maxFindings, 3);
  assert.ok(cfg.focusHint.length > 0);
});

test('getReviewDepthConfig: medium returns maxFindings=8', () => {
  const cfg = getReviewDepthConfig('medium');
  assert.equal(cfg.maxFindings, 8);
});

test('getReviewDepthConfig: large returns maxFindings=15', () => {
  const cfg = getReviewDepthConfig('large');
  assert.equal(cfg.maxFindings, 15);
});

test('getReviewDepthConfig: unknown mode falls back to medium', () => {
  const cfg = getReviewDepthConfig('unknown');
  assert.equal(cfg.maxFindings, 8);
});

test('getReviewDepthConfig: focusHint is non-empty for each mode', () => {
  assert.ok(getReviewDepthConfig('tiny').focusHint.length > 0);
  assert.ok(getReviewDepthConfig('medium').focusHint.length > 0);
  assert.ok(getReviewDepthConfig('large').focusHint.length > 0);
});
