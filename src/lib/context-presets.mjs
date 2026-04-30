// Context preset budgets for collectRepoContext (#689 PR-D).
//
// reviewMode is a friendly knob that picks a preset budget so users do
// not have to think in token counts. When the user sets
// config.context.reviewMode but omits config.context.budget, the
// collector applies the preset below; an explicit `budget: { ... }`
// always wins.
//
// Per-section caps are deliberately conservative so the legacy char
// budget is also respected automatically (collectRepoContext uses
// Math.min(SECTION_CAPS, perSectionCap, charBudget, tokenBudget)).

const PRESETS = Object.freeze({
  // tiny: short prompts, model with a tight context window, or a CI
  // regression run that wants the absolute minimum context.
  tiny: Object.freeze({
    maxTokens: 1024,
    perSectionCaps: Object.freeze({
      fullFile: 1500,
      tests: 1000,
      usages: 800,
      config: 300,
    }),
  }),
  // medium: default working budget — good for typical PRs on
  // gpt-4o-mini / sonnet-class models.
  medium: Object.freeze({
    maxTokens: 4000,
    perSectionCaps: Object.freeze({
      fullFile: 3000,
      tests: 2000,
      usages: 1500,
      config: 500,
    }),
  }),
  // large: roomy budget for big-model deep dives. Stops shy of the
  // contextBudgetSchema upper bound (64k) so callers still have head
  // room for the diff and the system prompt itself.
  large: Object.freeze({
    maxTokens: 16000,
    perSectionCaps: Object.freeze({
      fullFile: 8000,
      tests: 4000,
      usages: 3000,
      config: 1000,
    }),
  }),
});

/**
 * Look up the preset for a reviewMode value. Unknown / falsy values
 * return null so callers fall back to their existing defaults.
 *
 * @param {('tiny'|'medium'|'large'|null|undefined)} reviewMode
 * @returns {{ maxTokens: number, perSectionCaps: object } | null}
 */
export function presetForReviewMode(reviewMode) {
  if (!reviewMode) return null;
  return PRESETS[reviewMode] ?? null;
}

/**
 * Resolve the effective budget given a `config.context` payload. The
 * resolution order is:
 *   1. explicit `budget` (always wins)
 *   2. preset matching `reviewMode`
 *   3. null (collector uses its built-in defaults)
 *
 * @param {object} [contextConfig]
 * @returns {{ maxTokens?: number, maxChars?: number, perSectionCaps?: object } | null}
 */
export function resolveContextBudget(contextConfig) {
  if (!contextConfig) return null;
  if (contextConfig.budget) return contextConfig.budget;
  return presetForReviewMode(contextConfig.reviewMode);
}

// Exported for tests.
export const _PRESETS = PRESETS;
