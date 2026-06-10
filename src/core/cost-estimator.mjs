const DEFAULT_MODEL = 'gpt-4-turbo';
const PRICING_LAST_UPDATED = '2026-05-14'; // adjust when pricing changes

// Per-1k-token rates in USD. `cacheReadPer1k` (optional) covers Anthropic
// ephemeral prompt cache reads and OpenAI `cached_tokens` discounted inputs;
// fallbacks to inputPer1k * 0.1 when omitted.
const MODEL_PRICES = {
  // --- OpenAI ---
  'gpt-4': { inputPer1k: 0.03, outputPer1k: 0.06 },
  'gpt-4-turbo': { inputPer1k: 0.01, outputPer1k: 0.03 },
  'gpt-3.5-turbo': { inputPer1k: 0.0005, outputPer1k: 0.0015 },
  'gpt-4o': { inputPer1k: 0.0025, outputPer1k: 0.01, cacheReadPer1k: 0.00125 },
  'gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.0006, cacheReadPer1k: 0.000075 },
  o1: { inputPer1k: 0.015, outputPer1k: 0.06 },
  'o1-mini': { inputPer1k: 0.003, outputPer1k: 0.012 },
  // --- Anthropic ---
  // Cache write surcharge (1.25x input) is included implicitly via inputPer1k
  // for cacheCreationInputTokens billing; cache read is 0.1x input.
  'claude-opus-4-7': { inputPer1k: 0.015, outputPer1k: 0.075, cacheReadPer1k: 0.0015 },
  'claude-sonnet-4-6': { inputPer1k: 0.003, outputPer1k: 0.015, cacheReadPer1k: 0.0003 },
  'claude-haiku-4-5': { inputPer1k: 0.001, outputPer1k: 0.005, cacheReadPer1k: 0.0001 },
};

function getPricing(model) {
  return MODEL_PRICES[model] ?? MODEL_PRICES[DEFAULT_MODEL];
}

function toUSD(value) {
  return Math.round(value * 10000) / 10000;
}

/**
 * Simple cost estimator for LLM usage.
 * Rates are approximate; adjust as pricing changes.
 */
export class CostEstimator {
  constructor(model = DEFAULT_MODEL) {
    this.model = model;
    this.pricing = getPricing(model);
    this.lastUpdated = PRICING_LAST_UPDATED;
  }

  /**
   * Estimate cost from token counts.
   * @param {number} inputTokens
   * @param {number} outputTokens
   * @returns {{usd: number, inputTokens: number, outputTokens: number, model: string}}
   */
  estimateCost(inputTokens = 0, outputTokens = 0) {
    const inCost = (inputTokens / 1000) * this.pricing.inputPer1k;
    const outCost = (outputTokens / 1000) * this.pricing.outputPer1k;
    return {
      usd: toUSD(inCost + outCost),
      inputTokens,
      outputTokens,
      model: this.model,
    };
  }

  /**
   * Compute cost from a normalized usage record (the shape produced by
   * AnthropicClient.lastUsage / OpenAIClient.lastUsage). Splits the input
   * bucket into fresh vs cache-read so prompt-caching savings are surfaced.
   *
   * @param {{model?: string, inputTokens?: number, outputTokens?: number, cacheCreationInputTokens?: number, cacheReadInputTokens?: number}} usage
   */
  estimateFromUsage(usage) {
    if (!usage) return null;
    const pricing = MODEL_PRICES[usage.model] ?? this.pricing;
    const freshInput = (usage.inputTokens ?? 0) - (usage.cacheReadInputTokens ?? 0);
    const cacheRead = usage.cacheReadInputTokens ?? 0;
    const cacheCreate = usage.cacheCreationInputTokens ?? 0;
    const output = usage.outputTokens ?? 0;
    const cacheReadRate = pricing.cacheReadPer1k ?? pricing.inputPer1k * 0.1;
    // Anthropic charges 1.25x input rate for cache writes; we already count
    // them via inputTokens (SDK reports cache_creation separately but it
    // overlaps with input_tokens). Treat cacheCreation as a *surcharge* delta:
    // extra 0.25 * input rate per token. OpenAI does not bill cache writes.
    const cacheWriteSurcharge =
      usage.provider === 'anthropic' ? (cacheCreate / 1000) * pricing.inputPer1k * 0.25 : 0;
    const usd =
      (Math.max(0, freshInput) / 1000) * pricing.inputPer1k +
      (cacheRead / 1000) * cacheReadRate +
      cacheWriteSurcharge +
      (output / 1000) * pricing.outputPer1k;
    return {
      usd: toUSD(usd),
      model: usage.model ?? this.model,
      provider: usage.provider ?? null,
      breakdown: {
        freshInputTokens: Math.max(0, freshInput),
        cacheReadTokens: cacheRead,
        cacheCreationTokens: cacheCreate,
        outputTokens: output,
      },
    };
  }

  /**
   * Rough estimate from diff+skills.
   * Uses diff token estimate plus skill overhead (instructions/prompts).
   * @param {{tokenEstimate?: number, rawTokenEstimate?: number}} diff
   * @param {Array} skills
   */
  estimateFromDiff(diff = {}, skills = []) {
    const baseTokens = diff.tokenEstimate ?? diff.rawTokenEstimate ?? 0;
    const skillTokens = skills.length * 200; // overhead per skill
    const inputTokens = baseTokens + skillTokens;
    const outputTokens = Math.max(300, skills.length * 50); // small response allowance
    return this.estimateCost(inputTokens, outputTokens);
  }

  /**
   * Format cost information for human-friendly display.
   * @param {{usd: number, inputTokens: number, outputTokens: number, model: string}} cost
   */
  formatCost(cost) {
    const usd = cost?.usd ?? 0;
    return `Model: ${cost?.model || this.model}
Estimated cost: $${usd.toFixed(4)} USD
Tokens: ${cost.inputTokens} (input) + ${cost.outputTokens} (output)
Pricing last updated: ${this.lastUpdated}`;
  }
}

export { MODEL_PRICES, PRICING_LAST_UPDATED };
export default CostEstimator;
