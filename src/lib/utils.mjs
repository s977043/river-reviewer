/**
 * Parse a comma-separated list string into a trimmed array.
 * Empty/undefined input returns an empty array.
 */
export function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

/**
 * Check if an LLM (OpenAI) API key is configured in the environment.
 * @returns {boolean}
 */
export function isLlmEnabled() {
  return !!(
    process.env.RIVER_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GOOGLE_API_KEY
  );
}
