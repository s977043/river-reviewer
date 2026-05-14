import assert from 'node:assert/strict';
import test, { afterEach, beforeEach, describe } from 'node:test';

import {
  isRetriableError,
  withRetry,
  parseRetryAfter,
  getBackoffMs,
  resolveAnthropicMaxTokens,
  __clearAIClientCacheForTests,
  AIClientFactory,
} from '../src/ai/factory.mjs';

// ---------------------------------------------------------------------------
// isRetriableError
// ---------------------------------------------------------------------------

describe('isRetriableError', () => {
  test('returns true for HTTP 429 (rate limit)', () => {
    assert.equal(isRetriableError({ status: 429 }), true);
  });

  test('returns true for HTTP 500 (server error)', () => {
    assert.equal(isRetriableError({ status: 500 }), true);
  });

  test('returns true for HTTP 503 (service unavailable)', () => {
    assert.equal(isRetriableError({ status: 503 }), true);
  });

  test('returns true for nested response.status 429', () => {
    assert.equal(isRetriableError({ response: { status: 429 } }), true);
  });

  test('returns true for AbortError', () => {
    assert.equal(isRetriableError({ name: 'AbortError' }), true);
  });

  test('returns true for ETIMEDOUT', () => {
    assert.equal(isRetriableError({ code: 'ETIMEDOUT' }), true);
  });

  test('returns true for ECONNRESET', () => {
    assert.equal(isRetriableError({ code: 'ECONNRESET' }), true);
  });

  test('returns true for ENOTFOUND', () => {
    assert.equal(isRetriableError({ code: 'ENOTFOUND' }), true);
  });

  test('returns false for HTTP 401 (auth error)', () => {
    assert.equal(isRetriableError({ status: 401 }), false);
  });

  test('returns false for HTTP 400 (bad request)', () => {
    assert.equal(isRetriableError({ status: 400 }), false);
  });

  test('returns false for generic Error', () => {
    assert.equal(isRetriableError(new Error('something')), false);
  });

  test('returns false for null/undefined', () => {
    assert.equal(isRetriableError(null), false);
    assert.equal(isRetriableError(undefined), false);
  });
});

// ---------------------------------------------------------------------------
// withRetry
// ---------------------------------------------------------------------------

describe('withRetry', () => {
  test('returns value on success', async () => {
    const result = await withRetry(() => Promise.resolve(42));
    assert.equal(result, 42);
  });

  test('retries on retriable error and succeeds', async () => {
    let attempt = 0;
    const result = await withRetry(() => {
      attempt += 1;
      if (attempt < 2) {
        const err = new Error('rate limited');
        err.status = 429;
        throw err;
      }
      return 'ok';
    });
    assert.equal(result, 'ok');
    assert.equal(attempt, 2);
  });

  test('throws after max retries exceeded', async () => {
    let attempt = 0;
    await assert.rejects(
      withRetry(() => {
        attempt += 1;
        const err = new Error('timeout');
        err.code = 'ETIMEDOUT';
        throw err;
      }),
      (err) => {
        assert.match(err.message, /timeout/);
        return true;
      },
    );
    // MAX_RETRIES = 2, so attempt should be 3 (1 initial + 2 retries)
    assert.equal(attempt, 3);
  });

  test('does not retry non-retriable errors', async () => {
    let attempt = 0;
    await assert.rejects(
      withRetry(() => {
        attempt += 1;
        const err = new Error('auth');
        err.status = 401;
        throw err;
      }),
      (err) => {
        assert.match(err.message, /auth/);
        return true;
      },
    );
    assert.equal(attempt, 1);
  });
});

// ---------------------------------------------------------------------------
// AIClientFactory.create
// ---------------------------------------------------------------------------

describe('AIClientFactory.create', () => {
  test('throws when modelName is not provided', () => {
    assert.throws(() => AIClientFactory.create({}), /モデル名/);
    assert.throws(() => AIClientFactory.create({ modelName: '' }), /モデル名/);
  });

  test('throws for unsupported model name', () => {
    assert.throws(
      () => AIClientFactory.create({ modelName: 'mistral-large' }),
      /Unsupported model/,
    );
  });

  // --- Anthropic (Claude) provider ---
  describe('claude-* models', () => {
    let originalAnthropicKey;
    let originalRiverAnthropicKey;

    beforeEach(() => {
      originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
      originalRiverAnthropicKey = process.env.RIVER_ANTHROPIC_API_KEY;
      __clearAIClientCacheForTests();
    });

    afterEach(() => {
      if (originalAnthropicKey === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
      if (originalRiverAnthropicKey === undefined) delete process.env.RIVER_ANTHROPIC_API_KEY;
      else process.env.RIVER_ANTHROPIC_API_KEY = originalRiverAnthropicKey;
      __clearAIClientCacheForTests();
    });

    test('throws when ANTHROPIC_API_KEY is not set', () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.RIVER_ANTHROPIC_API_KEY;
      assert.throws(
        () => AIClientFactory.create({ modelName: 'claude-sonnet-4-6' }),
        /ANTHROPIC_API_KEY/,
      );
    });

    test('creates AnthropicClient when ANTHROPIC_API_KEY is set', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
      const client = AIClientFactory.create({ modelName: 'claude-sonnet-4-6' });
      assert.ok(client);
      assert.equal(typeof client.generateReview, 'function');
    });

    test('falls back to RIVER_ANTHROPIC_API_KEY when ANTHROPIC_API_KEY is unset', () => {
      delete process.env.ANTHROPIC_API_KEY;
      process.env.RIVER_ANTHROPIC_API_KEY = 'sk-ant-river-test-key';
      const client = AIClientFactory.create({ modelName: 'claude-haiku-4-5' });
      assert.ok(client);
      assert.equal(typeof client.generateReview, 'function');
    });

    test('returns same cached instance for repeated calls with identical args', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
      const a = AIClientFactory.create({ modelName: 'claude-sonnet-4-6', temperature: 0 });
      const b = AIClientFactory.create({ modelName: 'claude-sonnet-4-6', temperature: 0 });
      assert.strictEqual(a, b);
    });

    test('returns distinct instances for different maxTokens', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
      const small = AIClientFactory.create({ modelName: 'claude-sonnet-4-6', maxTokens: 1024 });
      const large = AIClientFactory.create({ modelName: 'claude-sonnet-4-6', maxTokens: 8192 });
      assert.notStrictEqual(small, large);
      assert.equal(small.maxTokens, 1024);
      assert.equal(large.maxTokens, 8192);
    });
  });

  // --- unsupported model placeholder ---
  // Use a clearly-reserved fake provider prefix so adding a real Mistral
  // provider later cannot silently turn this expectation into a false pass.
  test('throws for fully unknown provider prefix', () => {
    assert.throws(
      () => AIClientFactory.create({ modelName: 'unsupported-fake-provider-xyz' }),
      /Unsupported model/,
    );
  });
});

// ---------------------------------------------------------------------------
// parseRetryAfter / getBackoffMs
// ---------------------------------------------------------------------------

describe('parseRetryAfter', () => {
  test('parses integer seconds', () => {
    assert.equal(parseRetryAfter('2'), 2000);
  });

  test('parses fractional seconds (floored to ms)', () => {
    assert.equal(parseRetryAfter('1.5'), 1500);
  });

  test('parses HTTP-date format', () => {
    const future = new Date(Date.now() + 60000).toUTCString();
    const ms = parseRetryAfter(future);
    assert.ok(ms !== null && ms >= 55000 && ms <= 65000, `expected ~60000ms, got ${ms}`);
  });

  test('returns null for invalid input', () => {
    assert.equal(parseRetryAfter(''), null);
    assert.equal(parseRetryAfter(undefined), null);
    assert.equal(parseRetryAfter('not-a-date'), null);
  });

  test('clamps negative numeric values to null', () => {
    assert.equal(parseRetryAfter('-3'), null);
  });
});

describe('getBackoffMs', () => {
  test('returns linear backoff when no retry-after header', () => {
    assert.equal(getBackoffMs({}, 1), 500);
    assert.equal(getBackoffMs({}, 2), 1000);
  });

  test('honors retry-after header from err.headers', () => {
    assert.equal(getBackoffMs({ headers: { 'retry-after': '3' } }, 1), 3000);
  });

  test('honors retry-after header from err.response.headers', () => {
    assert.equal(getBackoffMs({ response: { headers: { 'retry-after': '4' } } }, 1), 4000);
  });

  test('honors Anthropic-specific rate-limit reset headers', () => {
    // toUTCString() only encodes whole seconds, so the round-trip can drop
    // up to ~1s of precision; we just assert the value is in a sane window
    // and clearly comes from the header (not the 500ms linear fallback).
    const future = new Date(Date.now() + 5000).toUTCString();
    const ms = getBackoffMs(
      { headers: { 'anthropic-ratelimit-requests-reset': future } },
      1,
    );
    assert.ok(ms > 1000 && ms <= 6000, `expected ~5s, got ${ms}ms`);
  });

  test('caps absurd retry-after values at MAX_RETRY_DELAY_MS (30s)', () => {
    assert.equal(getBackoffMs({ headers: { 'retry-after': '99999' } }, 1), 30_000);
  });
});

// ---------------------------------------------------------------------------
// resolveAnthropicMaxTokens
// ---------------------------------------------------------------------------

describe('resolveAnthropicMaxTokens', () => {
  test('explicit positive value wins', () => {
    assert.equal(resolveAnthropicMaxTokens('claude-opus-4-7', 2048), 2048);
  });

  test('falls back to model table when explicit is omitted', () => {
    assert.equal(resolveAnthropicMaxTokens('claude-opus-4-7'), 8192);
    assert.equal(resolveAnthropicMaxTokens('claude-sonnet-4-6'), 8192);
    assert.equal(resolveAnthropicMaxTokens('claude-haiku-4-5'), 4096);
  });

  test('falls back to global default for unknown claude variants', () => {
    assert.equal(resolveAnthropicMaxTokens('claude-future-9000'), 4096);
  });

  test('ignores non-positive explicit values', () => {
    assert.equal(resolveAnthropicMaxTokens('claude-opus-4-7', 0), 8192);
    assert.equal(resolveAnthropicMaxTokens('claude-opus-4-7', -1), 8192);
  });
});

// ---------------------------------------------------------------------------
// AnthropicClient.generateReview (mocked SDK)
// ---------------------------------------------------------------------------

describe('AnthropicClient.generateReview', () => {
  let originalAnthropicKey;

  beforeEach(() => {
    originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
    __clearAIClientCacheForTests();
  });

  afterEach(() => {
    if (originalAnthropicKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    __clearAIClientCacheForTests();
  });

  function stubMessagesCreate(client, fn) {
    client.anthropic = { messages: { create: fn } };
  }

  test('calls messages.create with model / max_tokens / system / messages and returns text', async () => {
    const client = AIClientFactory.create({
      modelName: 'claude-sonnet-4-6',
      temperature: 0.1,
      maxTokens: 2048,
    });
    let received;
    stubMessagesCreate(client, async (args) => {
      received = args;
      return { content: [{ type: 'text', text: 'looks good' }] };
    });

    const review = await client.generateReview('system-prompt', 'diff-text');
    assert.equal(review, 'looks good');
    assert.equal(received.model, 'claude-sonnet-4-6');
    assert.equal(received.max_tokens, 2048);
    assert.equal(received.temperature, 0.1);
    assert.equal(received.system, 'system-prompt');
    assert.deepEqual(received.messages, [{ role: 'user', content: 'diff-text' }]);
  });

  test('concatenates multiple text blocks (skips non-text blocks)', async () => {
    const client = AIClientFactory.create({ modelName: 'claude-sonnet-4-6' });
    stubMessagesCreate(client, async () => ({
      content: [
        { type: 'thinking', text: 'internal-thought-should-be-skipped' },
        { type: 'text', text: 'first' },
        { type: 'tool_use', name: 'noop' },
        { type: 'text', text: 'second' },
      ],
    }));

    const review = await client.generateReview('s', 'd');
    assert.equal(review, 'first\nsecond');
  });

  test('returns empty string for empty / missing content array', async () => {
    const client = AIClientFactory.create({ modelName: 'claude-sonnet-4-6' });
    stubMessagesCreate(client, async () => ({ content: [] }));
    assert.equal(await client.generateReview('s', 'd'), '');

    __clearAIClientCacheForTests();
    const client2 = AIClientFactory.create({ modelName: 'claude-sonnet-4-6' });
    stubMessagesCreate(client2, async () => ({}));
    assert.equal(await client2.generateReview('s', 'd'), '');
  });

  test('retries on 429 then succeeds (withRetry integration)', async () => {
    const client = AIClientFactory.create({ modelName: 'claude-sonnet-4-6' });
    let calls = 0;
    stubMessagesCreate(client, async () => {
      calls += 1;
      if (calls === 1) {
        const err = new Error('rate limited');
        err.status = 429;
        err.headers = { 'retry-after': '0' };
        throw err;
      }
      return { content: [{ type: 'text', text: 'ok-after-retry' }] };
    });
    const review = await client.generateReview('s', 'd');
    assert.equal(review, 'ok-after-retry');
    assert.equal(calls, 2);
  });

  test('does not retry on 401 (auth error)', async () => {
    const client = AIClientFactory.create({ modelName: 'claude-sonnet-4-6' });
    let calls = 0;
    stubMessagesCreate(client, async () => {
      calls += 1;
      const err = new Error('unauthorized');
      err.status = 401;
      throw err;
    });
    await assert.rejects(client.generateReview('s', 'd'), /unauthorized/);
    assert.equal(calls, 1);
  });

  test('uses model-default max_tokens when caller omits it', async () => {
    const client = AIClientFactory.create({ modelName: 'claude-opus-4-7' });
    let received;
    stubMessagesCreate(client, async (args) => {
      received = args;
      return { content: [{ type: 'text', text: '' }] };
    });
    await client.generateReview('s', 'd');
    assert.equal(received.max_tokens, 8192);
  });
});
