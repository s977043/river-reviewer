import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { isRetriableError, withRetry, AIClientFactory } from '../src/ai/factory.mjs';

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
    assert.throws(() => AIClientFactory.create({ modelName: 'claude-3' }), /Unsupported model/);
  });
});
