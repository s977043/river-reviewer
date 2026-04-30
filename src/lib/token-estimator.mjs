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
  // matchAll + counter avoids materializing the full match array, which
  // matters once callers feed in 200k-char prompts (config.context.budget
  // upper bound). Counting the iterator stays O(matches) on memory.
  let n = 0;
  for (const _ of text.matchAll(CJK_RE)) n += 1;
  return n;
}

/**
 * Estimate the number of tokens an LLM tokenizer would assign to `text`.
 *
 * PR-A only implements the `heuristic` tokenizer. The schema
 * (`contextConfigSchema.tokenizer` enum: `heuristic`) is intentionally
 * strict — it rejects unknown values at config-load time so typos
 * surface immediately rather than silently degrading to heuristic. PR-E
 * will add `tiktoken` to both the schema enum and the dispatch below.
 *
 * `opts.model` is reserved for the same PR-E work.
 *
 * @param {string} text
 * @param {object} [opts]
 * @param {string} [opts.model] reserved for future tokenizer plugins
 * @returns {number} non-negative integer
 */
export function estimateTokens(text, opts = {}) {
  if (text == null) return 0;
  const s = String(text);
  if (s.length === 0) return 0;
  // opts is currently unused at runtime; kept for the API contract
  // documented above so PR-E can extend without a breaking change.
  void opts;

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
 * Char budget -> safe upper bound on tokens.
 *
 * Returns the worst-case token count for a budget of `maxChars`: assumes
 * the entire input is CJK (chars/2). Callers using this to gate "will
 * the prompt fit" stay under the real LLM tokenizer limit even when the
 * input shifts toward Japanese. Use estimateTokens() for the actual
 * per-string estimate when accuracy matters more than safety.
 */
export function charsToTokens(maxChars, _opts = {}) {
  if (!Number.isFinite(maxChars) || maxChars <= 0) return 0;
  return Math.floor(maxChars / CJK_DIVISOR);
}

/**
 * Token budget -> safe upper bound on chars.
 *
 * Returns the maximum chars that cannot exceed `maxTokens` even for
 * fully-CJK input (where every char counts as 1/2 token). Callers using
 * this to gate per-section maxChars stay under the prompt budget even
 * when the section ends up CJK-heavy. Use estimateTokens() to verify
 * a specific assembled prompt fits.
 */
export function tokensToChars(maxTokens, _opts = {}) {
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) return 0;
  return Math.floor(maxTokens * CJK_DIVISOR);
}
