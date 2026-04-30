// Token estimator for prompt budget accounting (#689 PR-A).
//
// Lightweight, deterministic estimator that the upcoming context-ranking
// + budget control work in #689 PR-B/PR-C will consume. PR-A ships the
// pure function and tests; pipeline integration lands in PR-C.
//
// Design notes:
// - The default `heuristic` algorithm uses chars/4 for ASCII-dominant text
//   and chars/2 for CJK-dominant text. This is **deliberately rough**:
//   exact tokenization (tiktoken / @anthropic-ai/tokenizer) lives in PR-E
//   as an opt-in adapter so PR-A can stay dependency-free.
// - Detection is per-string, not per-character. We bucket the input by the
//   ratio of CJK code points and pick a divisor accordingly so a mostly-
//   English string with a few Japanese variable names still gets the more
//   accurate ascii estimate.
// - The exported `estimateTokens` is pure: same input always returns the
//   same number. This matters for #687 fingerprint stability if anything
//   downstream ever incorporates the estimate.

const ASCII_DIVISOR = 4;
const CJK_DIVISOR = 2;

// Hiragana, Katakana (incl. half-width fullwidth), CJK Unified Ideographs
// and the most common compatibility ranges. Intentionally narrow — we only
// need a quick "is this string CJK-heavy" test, not full unicode coverage.
const CJK_RE = /[぀-ゟ゠-ヿ一-鿿ｦ-ﾟ]/g;

/**
 * Count Unicode code points (not UTF-16 code units) so surrogate pairs
 * (e.g. some emoji) don't double-count. Matters for very long strings
 * where the difference moves the estimate by several percent.
 */
function codePointLength(text) {
  let n = 0;
  // for...of on a string iterates code points.
  for (const _ of text) n += 1;
  return n;
}

function cjkCount(text) {
  const matches = text.match(CJK_RE);
  return matches ? matches.length : 0;
}

/**
 * Estimate the number of tokens an LLM tokenizer would assign to `text`.
 *
 * @param {string} text
 * @param {object} [opts]
 * @param {string} [opts.model] reserved for future tokenizer plugins
 * @param {('heuristic'|'tiktoken')} [opts.tokenizer] only `heuristic` is
 *   implemented in PR-A; PR-E will wire in `tiktoken`. Anything other
 *   than `heuristic` falls back to heuristic so callers cannot crash on
 *   future config that isn't yet supported.
 * @returns {number} non-negative integer
 */
export function estimateTokens(text, opts = {}) {
  if (text == null) return 0;
  const s = String(text);
  if (s.length === 0) return 0;

  // Future tokenizer hook (no-op for PR-A).
  // eslint-disable-next-line no-unused-vars
  const _model = opts.model;
  const _tokenizer = opts.tokenizer ?? 'heuristic';
  if (_tokenizer !== 'heuristic') {
    // Unknown tokenizer: fall back so callers don't crash on future opts.
  }

  const cjk = cjkCount(s);
  const total = codePointLength(s);
  if (total === 0) return 0;

  // Mixed: weight each code point by whether it looks CJK. This keeps
  // mostly-English strings on the ASCII divisor even when they contain a
  // few katakana variable names.
  const ascii = total - cjk;
  const tokens = ascii / ASCII_DIVISOR + cjk / CJK_DIVISOR;
  return Math.max(1, Math.ceil(tokens));
}

/**
 * Convenience: char budget -> approximate token budget.
 * Used by repo-context.mjs callers that still talk in `maxChars` while
 * the rest of the pipeline migrates to tokens (#689 PR-C).
 */
export function charsToTokens(maxChars, opts = {}) {
  if (!Number.isFinite(maxChars) || maxChars <= 0) return 0;
  // Treat the budget as ASCII-equivalent so callers see a conservative
  // upper bound. Real call sites pair this with an actual estimate of
  // the assembled prompt to verify they fit.
  return Math.floor(maxChars / ASCII_DIVISOR);
}

/**
 * Inverse: rough token budget -> char budget. Used to gate per-section
 * `maxChars` from a higher-level token cap in PR-C.
 */
export function tokensToChars(maxTokens, opts = {}) {
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) return 0;
  return Math.floor(maxTokens * ASCII_DIVISOR);
}
