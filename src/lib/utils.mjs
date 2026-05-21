/**
 * Parse a comma-separated list string into a trimmed array.
 * Empty/undefined input returns an empty array.
 */
export function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Check if an LLM (OpenAI / Gemini / Anthropic) API key is configured in the environment.
 * @returns {boolean}
 */
export function isLlmEnabled() {
  return !!(
    process.env.RIVER_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.RIVER_ANTHROPIC_API_KEY
  );
}

/**
 * Resolve the effective `availableContexts` for `buildExecutionPlan`'s
 * `inputContext`-based skill selection. Combines caller-supplied contexts
 * with `RIVER_AVAILABLE_CONTEXTS` (deduplicated). If the caller does not
 * supply any contexts, falls back to `defaultContexts` (defaults to
 * `['diff']`). The `alwaysInclude` option forces specific contexts to
 * remain present even when the caller passes a narrower list — useful
 * when the runtime has actually resolved an artifact (e.g. diff) and
 * should not let a CLI override silently strip it.
 *
 * Shared between `src/lib/local-runner.mjs` (legacy `river run`) and
 * `src/lib/review-plan.mjs` (`river review exec` / Phase 3).
 *
 * @param {string[] | null | undefined} inputContexts
 * @param {{ defaultContexts?: string[]; alwaysInclude?: string[] }} [options]
 * @returns {string[]}
 */
export function resolveAvailableContexts(
  inputContexts,
  { defaultContexts = ['diff'], alwaysInclude = [] } = {}
) {
  const envContexts = parseList(process.env.RIVER_AVAILABLE_CONTEXTS);
  const base = inputContexts && inputContexts.length ? inputContexts : defaultContexts;
  return [...new Set([...alwaysInclude, ...base, ...envContexts])];
}
