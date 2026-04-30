import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_WEIGHTS,
  pathProximity,
  scoreContextCandidate,
  symbolOverlap,
  testAffinity,
} from '../src/lib/context-ranker.mjs';

// --- pathProximity ---

test('pathProximity returns 1 for identical paths', () => {
  assert.equal(pathProximity('src/a/b.ts', 'src/a/b.ts'), 1);
});

test('pathProximity returns 0 when no directory prefix is shared', () => {
  assert.equal(pathProximity('src/a/b.ts', 'tests/c/d.ts'), 0);
});

test('pathProximity scores deeper shared prefixes higher than shallow ones', () => {
  const deep = pathProximity('src/auth/login.ts', 'src/auth/oauth.ts');
  const shallow = pathProximity('src/auth/login.ts', 'src/billing.ts');
  assert.ok(deep > shallow, `deep=${deep} should beat shallow=${shallow}`);
});

test('pathProximity is symmetric', () => {
  assert.equal(
    pathProximity('src/a/b.ts', 'src/a/c.ts'),
    pathProximity('src/a/c.ts', 'src/a/b.ts')
  );
});

test('pathProximity normalizes Windows-style separators', () => {
  assert.equal(
    pathProximity('src\\auth\\login.ts', 'src/auth/oauth.ts'),
    pathProximity('src/auth/login.ts', 'src/auth/oauth.ts')
  );
});

test('pathProximity returns 0 for empty / non-string inputs', () => {
  assert.equal(pathProximity('', 'src/x.ts'), 0);
  assert.equal(pathProximity('src/x.ts', ''), 0);
  assert.equal(pathProximity(null, 'src/x.ts'), 0);
  assert.equal(pathProximity('src/x.ts', undefined), 0);
});

test('pathProximity output is in [0, 1]', () => {
  const score = pathProximity('a/b/c/d/e/f.ts', 'a/b/c/g/h/i.ts');
  assert.ok(score >= 0 && score <= 1);
});

// --- symbolOverlap ---

test('symbolOverlap returns 0 when either input is empty', () => {
  assert.equal(symbolOverlap([], ['foo']), 0);
  assert.equal(symbolOverlap(['foo'], []), 0);
  assert.equal(symbolOverlap([], []), 0);
});

test('symbolOverlap returns 1 when all candidate symbols appear in reference', () => {
  assert.equal(symbolOverlap(['foo', 'bar'], ['foo', 'bar', 'baz']), 1);
});

test('symbolOverlap returns the fraction of candidate hits, not Jaccard', () => {
  // 1 of 4 candidate symbols appears in reference -> 0.25.
  // (Jaccard would give 1/(4+1) = 0.2, which is what we deliberately avoid.)
  assert.equal(symbolOverlap(['a', 'b', 'c', 'd'], ['a']), 0.25);
});

test('symbolOverlap is asymmetric (candidate vs reference matters)', () => {
  const a = symbolOverlap(['a', 'b'], ['a']);
  const b = symbolOverlap(['a'], ['a', 'b']);
  assert.notEqual(a, b);
});

test('symbolOverlap is robust to non-array inputs', () => {
  assert.equal(symbolOverlap(null, ['a']), 0);
  assert.equal(symbolOverlap(['a'], 'not-an-array'), 0);
});

// --- testAffinity ---

test('testAffinity recognises sibling .test.<ext> path', () => {
  assert.equal(testAffinity('src/a/b.test.ts', 'src/a/b.ts'), 1);
  assert.equal(testAffinity('src/a/b.spec.ts', 'src/a/b.ts'), 1);
});

test('testAffinity recognises mirrored tests/ tree', () => {
  assert.equal(testAffinity('tests/a/b.test.ts', 'src/a/b.ts'), 1);
});

test('testAffinity recognises __tests__ adjacent folder', () => {
  assert.equal(testAffinity('src/a/__tests__/b.test.ts', 'src/a/b.ts'), 1);
});

test('testAffinity returns 0 for unrelated paths', () => {
  assert.equal(testAffinity('docs/readme.md', 'src/a/b.ts'), 0);
  assert.equal(testAffinity('src/a/c.test.ts', 'src/a/b.ts'), 0);
});

test('testAffinity normalises Windows separators', () => {
  assert.equal(testAffinity('src\\a\\b.test.ts', 'src/a/b.ts'), 1);
});

// --- scoreContextCandidate ---

test('scoreContextCandidate returns 0 when no signals are provided', () => {
  assert.equal(scoreContextCandidate({}), 0);
  assert.equal(scoreContextCandidate({ signals: {} }), 0);
});

test('scoreContextCandidate clamps signal values to [0, 1]', () => {
  // pathProximity 2.0 should be clamped to 1, and the only weight in use
  // contributes its full share, so the final score is exactly 1.
  const score = scoreContextCandidate({
    signals: { pathProximity: 2 },
    weights: { pathProximity: 0.25 },
  });
  assert.equal(score, 1);
});

test('scoreContextCandidate ignores missing signals (no penalty)', () => {
  // With only pathProximity supplied, the result equals pathProximity
  // (weighted average over the *used* weights, not over all DEFAULT_WEIGHTS).
  const score = scoreContextCandidate({
    signals: { pathProximity: 0.5 },
  });
  assert.equal(score, 0.5);
});

test('scoreContextCandidate is a true weighted average over the used signals', () => {
  // Two equal-weight signals at 1.0 and 0.0 -> 0.5.
  const score = scoreContextCandidate({
    signals: { pathProximity: 1, symbolOverlap: 0 },
    weights: { pathProximity: 0.5, symbolOverlap: 0.5 },
  });
  assert.equal(score, 0.5);
});

test('scoreContextCandidate output is always in [0, 1]', () => {
  const all = {
    pathProximity: 1,
    symbolOverlap: 1,
    testAffinity: 1,
    importGraph: 1,
    commitRecency: 1,
    riskMapWeight: 1,
    skillInputContextHit: 1,
  };
  const score = scoreContextCandidate({ signals: all });
  assert.ok(score >= 0 && score <= 1);
});

test('scoreContextCandidate ignores zero / negative weights', () => {
  const score = scoreContextCandidate({
    signals: { pathProximity: 1, symbolOverlap: 0 },
    weights: { pathProximity: 0, symbolOverlap: 0.5 },
  });
  assert.equal(score, 0);
});

test('DEFAULT_WEIGHTS is frozen so callers cannot mutate the source list', () => {
  assert.throws(
    () => {
      DEFAULT_WEIGHTS.somethingNew = 1;
    },
    /read[- ]only|object is not extensible/i
  );
});
