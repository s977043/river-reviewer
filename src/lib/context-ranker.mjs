// Context ranking for repo-wide review (#689 PR-B).
//
// Pure-function building blocks the upcoming PR-C will use to rank
// candidate context entries (full files, tests, symbol usages, configs)
// before they get assembled into the prompt under a token budget. This
// PR ships the ranker functions and tests; pipeline integration is
// PR-C scope.
//
// Design principles
// - Every signal is a pure function of its arguments. The collector
//   computes signals from disk / git in PR-C, then hands them off to
//   scoreContextCandidate as plain values. This keeps the ranker
//   testable without spinning up a temp filesystem.
// - Each signal returns a number in [0, 1]. Callers feed weights through
//   scoreContextCandidate; the weights themselves are 0..1 and the
//   final score is the weighted average normalized to [0, 1].
// - Signals that cannot be computed in PR-B (commit recency from git,
//   skill input-context match, risk-map level) are NOT implemented here
//   — they live on the caller side in PR-C and are passed in as a
//   pre-computed score on the `signals` parameter to
//   scoreContextCandidate. PR-B intentionally stays self-contained.

import path from 'node:path';

// Default weights mirror the proposal in the #689 plan §3. Callers can
// override per-signal via scoreContextCandidate(..., { weights: ... }).
// Keys must match the user-facing schema in src/config/schema.mjs
// (contextRankingSchema.weights) so `signals[k]` and `weights[k]` line
// up when user config flows through scoreContextCandidate.
export const DEFAULT_WEIGHTS = Object.freeze({
  pathProximity: 0.25,
  symbolUsage: 0.2,
  siblingTest: 0.15,
  // Reserved for PR-C; PR-B does not compute these but the combiner
  // accepts them as `signals.<name>` if the caller pre-computed them.
  importGraph: 0.15,
  commitRecency: 0.1,
  riskMapWeight: 0.1,
  skillInputContextHit: 0.05,
});

/**
 * Path-proximity signal: how close `candidate` lives to `changed` in the
 * directory tree, normalized so 1.0 means identical path and 0.0 means
 * no shared dir prefix.
 *
 * @param {string} candidate relative repo path of the candidate file
 * @param {string} changed relative repo path of the changed file
 * @returns {number} 0..1
 */
export function pathProximity(candidate, changed) {
  if (typeof candidate !== 'string' || typeof changed !== 'string') return 0;
  if (!candidate || !changed) return 0;
  if (candidate === changed) return 1;

  // Normalize to forward slashes so Windows-style paths score the same.
  const a = candidate.replace(/\\/g, '/').split('/').filter(Boolean);
  const b = changed.replace(/\\/g, '/').split('/').filter(Boolean);

  let shared = 0;
  const min = Math.min(a.length, b.length);
  for (let i = 0; i < min; i += 1) {
    if (a[i] === b[i]) shared += 1;
    else break;
  }
  // Use the deeper of the two paths as the denominator. This avoids
  // rewarding shallow paths (`src/x.ts` vs `src/y.ts`) the same as deep
  // paths sharing the same prefix.
  const max = Math.max(a.length, b.length, 1);
  return Math.min(1, shared / max);
}

/**
 * Symbol-usage signal (a.k.a. asymmetric symbol overlap): fraction of
 * `candidateSymbols` that appear in `referenceSymbols`. Unlike a Jaccard
 * index this is asymmetric — we care whether the candidate's exports
 * are referenced anywhere in the known usage set, not whether the sets
 * agree as a whole. The name matches contextRankingSchema.weights in
 * src/config/schema.mjs so user config flows through unchanged.
 *
 * @param {string[]} candidateSymbols
 * @param {string[]} referenceSymbols
 * @returns {number} 0..1
 */
export function symbolUsage(candidateSymbols, referenceSymbols) {
  if (!Array.isArray(candidateSymbols) || candidateSymbols.length === 0) return 0;
  if (!Array.isArray(referenceSymbols) || referenceSymbols.length === 0) return 0;
  const refSet = new Set(referenceSymbols);
  let hits = 0;
  for (const s of candidateSymbols) {
    if (refSet.has(s)) hits += 1;
  }
  return Math.min(1, hits / candidateSymbols.length);
}

/**
 * Sibling-test signal (a.k.a. test affinity): did the candidate look
 * like a test file paired with `changed`? Returns 1 when the candidate
 * path matches one of the standard test path heuristics for `changed`,
 * else 0. The name matches contextRankingSchema.weights in
 * src/config/schema.mjs so user config flows through unchanged.
 *
 * @param {string} candidate
 * @param {string} changed
 * @returns {number} 0..1
 */
export function siblingTest(candidate, changed) {
  if (typeof candidate !== 'string' || typeof changed !== 'string') return 0;
  if (!candidate || !changed) return 0;

  const norm = (p) => p.replace(/\\/g, '/');
  const cand = norm(candidate);
  const orig = norm(changed);

  // Mirror the heuristics in src/lib/repo-context.mjs:TEST_SUFFIXES so
  // the ranker agrees with the collector. If those heuristics expand
  // there, update this set.
  const ext = '.test.$1';
  const spec = '.spec.$1';
  const candidates = [
    orig.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, ext),
    orig.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, spec),
    orig.replace(/src\//, 'tests/').replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, ext),
    (() => {
      const base = path.posix.basename(orig);
      const dir = path.posix.dirname(orig);
      return path.posix.join(dir, '__tests__', base.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, ext));
    })(),
  ];
  return candidates.includes(cand) ? 1 : 0;
}

/**
 * Combine signals into a final ranking score.
 *
 * Caller passes a {signals} object with per-signal scores in [0, 1].
 * Missing signals are treated as 0 so the function is total. The final
 * score is the dot product of signals and weights divided by the sum of
 * the weights actually used (so omitting commitRecency does not
 * artificially shrink the score).
 *
 * @param {object} args
 * @param {object} args.signals per-signal scores in [0, 1]
 * @param {object} [args.weights] override weights; defaults to DEFAULT_WEIGHTS
 * @returns {number} 0..1
 */
export function scoreContextCandidate({ signals = {}, weights = DEFAULT_WEIGHTS } = {}) {
  let dot = 0;
  let usedWeight = 0;
  for (const [k, w] of Object.entries(weights)) {
    if (typeof w !== 'number' || w <= 0) continue;
    const raw = signals[k];
    if (typeof raw !== 'number') continue;
    const clamped = Math.max(0, Math.min(1, raw));
    dot += w * clamped;
    usedWeight += w;
  }
  if (usedWeight === 0) return 0;
  return Math.max(0, Math.min(1, dot / usedWeight));
}
