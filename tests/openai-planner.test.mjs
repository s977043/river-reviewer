import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  resolveOpenAIConfig,
  resolvePlannerTimeoutMs,
  buildPlannerPrompt,
  parsePlannerJson,
  createOpenAIPlanner,
} from '../src/lib/openai-planner.mjs';

function withEnv(overrides, fn) {
  const keys = Object.keys(overrides);
  const backup = {};
  for (const k of keys) {
    backup[k] = process.env[k];
    if (overrides[k] === undefined) delete process.env[k];
    else process.env[k] = overrides[k];
  }
  try {
    return fn();
  } finally {
    for (const k of keys) {
      if (backup[k] === undefined) delete process.env[k];
      else process.env[k] = backup[k];
    }
  }
}

// ---------------------------------------------------------------------------
// resolveOpenAIConfig
// ---------------------------------------------------------------------------

describe('resolveOpenAIConfig', () => {
  test('uses option values when provided', () => {
    const cfg = resolveOpenAIConfig({
      apiKey: 'key-opt',
      model: 'gpt-4o',
      endpoint: 'https://custom.api/v1',
    });
    assert.equal(cfg.apiKey, 'key-opt');
    assert.equal(cfg.model, 'gpt-4o');
    assert.equal(cfg.endpoint, 'https://custom.api/v1');
  });

  test('falls back to env variables', () => {
    withEnv(
      {
        RIVER_OPENAI_API_KEY: 'key-env',
        RIVER_OPENAI_BASE_URL: 'https://env.api/v1',
        OPENAI_API_KEY: undefined,
        OPENAI_BASE_URL: undefined,
      },
      () => {
        const cfg = resolveOpenAIConfig();
        assert.equal(cfg.apiKey, 'key-env');
        assert.equal(cfg.endpoint, 'https://env.api/v1');
      },
    );
  });

  test('defaults to gpt-4o-mini and openai endpoint', () => {
    withEnv(
      {
        RIVER_OPENAI_API_KEY: undefined,
        OPENAI_API_KEY: undefined,
        RIVER_PLANNER_MODEL: undefined,
        RIVER_OPENAI_MODEL: undefined,
        OPENAI_MODEL: undefined,
        RIVER_OPENAI_BASE_URL: undefined,
        OPENAI_BASE_URL: undefined,
      },
      () => {
        const cfg = resolveOpenAIConfig();
        assert.equal(cfg.apiKey, undefined);
        assert.equal(cfg.model, 'gpt-4o-mini');
        assert.match(cfg.endpoint, /api\.openai\.com/);
      },
    );
  });
});

// ---------------------------------------------------------------------------
// resolvePlannerTimeoutMs
// ---------------------------------------------------------------------------

describe('resolvePlannerTimeoutMs', () => {
  test('uses option timeoutMs', () => {
    assert.equal(resolvePlannerTimeoutMs({ timeoutMs: 5000 }), 5000);
  });

  test('falls back to env RIVER_PLANNER_TIMEOUT', () => {
    withEnv({ RIVER_PLANNER_TIMEOUT: '10000' }, () => {
      assert.equal(resolvePlannerTimeoutMs(), 10000);
    });
  });

  test('defaults to 15000', () => {
    withEnv({ RIVER_PLANNER_TIMEOUT: undefined }, () => {
      assert.equal(resolvePlannerTimeoutMs(), 15000);
    });
  });

  test('ignores non-positive and non-finite values', () => {
    assert.equal(resolvePlannerTimeoutMs({ timeoutMs: -1 }), 15000);
    assert.equal(resolvePlannerTimeoutMs({ timeoutMs: 0 }), 15000);
    assert.equal(resolvePlannerTimeoutMs({ timeoutMs: NaN }), 15000);
  });
});

// ---------------------------------------------------------------------------
// buildPlannerPrompt
// ---------------------------------------------------------------------------

describe('buildPlannerPrompt', () => {
  test('includes phase and skills in prompt', () => {
    const prompt = buildPlannerPrompt({
      skills: [
        { id: 'skill-1', name: 'Security', phase: 'midstream', description: 'Check secrets' },
      ],
      context: { phase: 'midstream', changedFiles: ['src/auth.ts'] },
    });
    assert.match(prompt, /midstream/);
    assert.match(prompt, /skill-1/);
    assert.match(prompt, /src\/auth\.ts/);
    assert.match(prompt, /JSON/);
  });

  test('defaults to midstream phase when not provided', () => {
    const prompt = buildPlannerPrompt({ skills: [], context: {} });
    assert.match(prompt, /phase: midstream/);
  });

  test('handles empty skills array', () => {
    const prompt = buildPlannerPrompt({ skills: [], context: { phase: 'upstream' } });
    assert.match(prompt, /phase: upstream/);
    assert.match(prompt, /Candidate skills:/);
  });

  test('handles null/undefined context fields gracefully', () => {
    const prompt = buildPlannerPrompt({ skills: null, context: null });
    assert.match(prompt, /phase: midstream/);
    assert.match(prompt, /\(none\)/);
  });
});

// ---------------------------------------------------------------------------
// parsePlannerJson
// ---------------------------------------------------------------------------

describe('parsePlannerJson', () => {
  test('parses valid JSON array', () => {
    const result = parsePlannerJson('[{"id":"s1","priority":1,"reason":"test"}]');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 's1');
  });

  test('returns empty array for empty/whitespace input', () => {
    assert.deepEqual(parsePlannerJson(''), []);
    assert.deepEqual(parsePlannerJson('   '), []);
    assert.deepEqual(parsePlannerJson(null), []);
    assert.deepEqual(parsePlannerJson(undefined), []);
  });

  test('extracts JSON from markdown-wrapped output', () => {
    const input = '```json\n[{"id":"s1","priority":1,"reason":"ok"}]\n```';
    const result = parsePlannerJson(input);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 's1');
  });

  test('extracts JSON from text with prefix', () => {
    const input = 'Here are the results:\n[{"id":"s1","priority":1}]';
    const result = parsePlannerJson(input);
    assert.equal(result.length, 1);
  });

  test('throws for completely invalid input', () => {
    assert.throws(() => parsePlannerJson('not json at all'), /not valid JSON/);
  });

  test('returns parsed object for valid non-array JSON (caller handles type)', () => {
    // parsePlannerJson は JSON.parse が成功すれば返す。
    // 呼び出し元 (createOpenAIPlanner) が Array.isArray で型チェックする。
    const result = parsePlannerJson('{"id": "s1"}');
    assert.equal(typeof result, 'object');
    assert.equal(result.id, 's1');
  });
});

// ---------------------------------------------------------------------------
// createOpenAIPlanner
// ---------------------------------------------------------------------------

describe('createOpenAIPlanner', () => {
  test('returns planner object with model and plan function', () => {
    const planner = createOpenAIPlanner({ apiKey: 'test-key' });
    assert.equal(typeof planner.plan, 'function');
    assert.ok(planner.model);
    assert.ok(planner.endpoint);
  });

  test('plan() throws when no API key is configured', async () => {
    withEnv({ OPENAI_API_KEY: undefined, RIVER_OPENAI_API_KEY: undefined }, () => {
      const planner = createOpenAIPlanner();
      assert.rejects(
        planner.plan({ skills: [], context: {} }),
        /API key/,
      );
    });
  });
});
