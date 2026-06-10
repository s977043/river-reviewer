import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { CostEstimator, MODEL_PRICES } from '../src/core/cost-estimator.mjs';

describe('MODEL_PRICES table', () => {
  test('includes Anthropic Claude 4 family with cacheReadPer1k', () => {
    for (const model of ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5']) {
      const p = MODEL_PRICES[model];
      assert.ok(p, `missing pricing for ${model}`);
      assert.ok(p.inputPer1k > 0);
      assert.ok(p.outputPer1k > 0);
      assert.ok(typeof p.cacheReadPer1k === 'number' && p.cacheReadPer1k >= 0);
      // Anthropic publishes cache read at 10% of input rate.
      assert.ok(
        Math.abs(p.cacheReadPer1k - p.inputPer1k * 0.1) < 1e-9,
        `cacheReadPer1k for ${model} should be ~10% of inputPer1k`
      );
    }
  });

  test('includes recent OpenAI models', () => {
    for (const model of ['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini']) {
      assert.ok(MODEL_PRICES[model], `missing pricing for ${model}`);
    }
  });
});

describe('CostEstimator.estimateFromUsage', () => {
  test('returns null for null usage', () => {
    const e = new CostEstimator();
    assert.equal(e.estimateFromUsage(null), null);
  });

  test('computes Anthropic Sonnet cost with cache read discount', () => {
    const e = new CostEstimator();
    const result = e.estimateFromUsage({
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      inputTokens: 10_000, // total input
      outputTokens: 1_000,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 8_000, // 80% from cache
    });
    // freshInput = 10000 - 8000 = 2000
    // fresh: 2000 / 1000 * 0.003 = 0.006
    // cacheRead: 8000 / 1000 * 0.0003 = 0.0024
    // output: 1000 / 1000 * 0.015 = 0.015
    // total = 0.0234
    assert.equal(result.usd, 0.0234);
    assert.equal(result.breakdown.freshInputTokens, 2000);
    assert.equal(result.breakdown.cacheReadTokens, 8000);
  });

  test('adds 25% cache-write surcharge for Anthropic cacheCreation', () => {
    const e = new CostEstimator();
    const result = e.estimateFromUsage({
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      inputTokens: 4_000,
      outputTokens: 0,
      cacheCreationInputTokens: 4_000,
      cacheReadInputTokens: 0,
    });
    // fresh: 4000/1000 * 0.003 = 0.012
    // cacheWrite surcharge: 4000/1000 * 0.003 * 0.25 = 0.003
    // output: 0
    // total = 0.015
    assert.equal(result.usd, 0.015);
  });

  test('computes OpenAI gpt-4o-mini cost with cache read', () => {
    const e = new CostEstimator();
    const result = e.estimateFromUsage({
      provider: 'openai',
      model: 'gpt-4o-mini',
      inputTokens: 10_000,
      outputTokens: 500,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 5_000,
    });
    // freshInput = 5000
    // fresh: 5000/1000 * 0.00015 = 0.00075
    // cacheRead: 5000/1000 * 0.000075 = 0.000375
    // output: 500/1000 * 0.0006 = 0.0003
    // total = 0.001425 → toUSD rounds to 4 decimals → 0.0014
    assert.equal(result.usd, 0.0014);
    assert.equal(result.provider, 'openai');
  });

  test('falls back to default pricing for unknown model', () => {
    const e = new CostEstimator();
    const result = e.estimateFromUsage({
      provider: 'openai',
      model: 'completely-unknown-model',
      inputTokens: 1000,
      outputTokens: 1000,
    });
    assert.ok(result.usd > 0);
    assert.equal(result.model, 'completely-unknown-model');
  });
});
