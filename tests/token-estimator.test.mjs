import assert from 'node:assert/strict';
import test from 'node:test';

import {
  estimateTokens,
  charsToTokens,
  tokensToChars,
} from '../src/lib/token-estimator.mjs';

test('estimateTokens returns 0 for empty / null / undefined input', () => {
  assert.equal(estimateTokens(''), 0);
  assert.equal(estimateTokens(null), 0);
  assert.equal(estimateTokens(undefined), 0);
});

test('estimateTokens uses chars/4 for ASCII-dominant text', () => {
  // 100 ASCII chars -> ~25 tokens (chars / 4, ceil-ed).
  const ascii = 'a'.repeat(100);
  assert.equal(estimateTokens(ascii), 25);
});

test('estimateTokens uses chars/2 for fully-CJK text', () => {
  // 100 hiragana code points -> 50 tokens (chars / 2).
  const hiragana = 'あ'.repeat(100);
  assert.equal(estimateTokens(hiragana), 50);
});

test('estimateTokens weights mixed strings between 4 and 2', () => {
  // 50 ASCII + 50 hiragana -> 50/4 + 50/2 = 12.5 + 25 = 37.5 -> 38 tokens.
  const mixed = 'a'.repeat(50) + 'あ'.repeat(50);
  assert.equal(estimateTokens(mixed), 38);
});

test('estimateTokens never returns 0 for a non-empty input', () => {
  // A single ASCII char would be 0 if we didn't floor at 1.
  assert.equal(estimateTokens('x'), 1);
});

test('estimateTokens is deterministic across calls', () => {
  const sample = 'function foo() { return 1; } // ねこ';
  const a = estimateTokens(sample);
  const b = estimateTokens(sample);
  assert.equal(a, b);
});

test('estimateTokens accepts but ignores future tokenizer values', () => {
  // PR-A only ships heuristic. Future "tiktoken" must not crash; it
  // falls through to heuristic until PR-E wires the real tokenizer.
  const sample = 'a'.repeat(40);
  assert.equal(
    estimateTokens(sample, { tokenizer: 'tiktoken' }),
    estimateTokens(sample, { tokenizer: 'heuristic' })
  );
});

test('estimateTokens counts code points, not UTF-16 code units', () => {
  // 🌊 is a surrogate pair (length 2 in UTF-16). Still one code point.
  // Treated as ASCII for this heuristic since it is not in the CJK range.
  // 1 code point / 4 -> ceil(0.25) = 1.
  assert.equal(estimateTokens('🌊'), 1);
});

test('charsToTokens / tokensToChars round-trip approximately', () => {
  assert.equal(charsToTokens(8000), 2000);
  assert.equal(tokensToChars(2000), 8000);
  assert.equal(charsToTokens(0), 0);
  assert.equal(charsToTokens(-1), 0);
  assert.equal(tokensToChars(NaN), 0);
});
