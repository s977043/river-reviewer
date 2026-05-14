import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { aggregate, formatText } from '../scripts/usage-summary.mjs';

const sampleRecords = [
  {
    timestamp: '2026-05-14T01:00:00.000Z',
    runId: 'run-a',
    file: 'src/a.mjs',
    skill: 'security',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    inputTokens: 10000,
    outputTokens: 1000,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 8000,
  },
  {
    timestamp: '2026-05-14T01:00:01.000Z',
    runId: 'run-a',
    file: 'src/b.mjs',
    skill: 'security',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    inputTokens: 5000,
    outputTokens: 500,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 4000,
  },
  {
    timestamp: '2026-05-14T02:00:00.000Z',
    runId: 'run-b',
    file: 'src/c.mjs',
    skill: 'performance',
    provider: 'openai',
    model: 'gpt-4o-mini',
    inputTokens: 8000,
    outputTokens: 200,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
  },
];

describe('usage-summary aggregate', () => {
  test('groups by model by default and sums tokens', () => {
    const summary = aggregate(sampleRecords, 'model');
    const sonnet = summary.find((s) => s.key === 'claude-sonnet-4-6');
    const mini = summary.find((s) => s.key === 'gpt-4o-mini');
    assert.ok(sonnet);
    assert.ok(mini);
    assert.equal(sonnet.calls, 2);
    assert.equal(sonnet.inputTokens, 15000);
    assert.equal(sonnet.cacheReadTokens, 12000);
    assert.equal(mini.calls, 1);
    assert.equal(mini.cacheReadTokens, 0);
  });

  test('cache hit ratio is computed from totals', () => {
    const summary = aggregate(sampleRecords, 'model');
    const sonnet = summary.find((s) => s.key === 'claude-sonnet-4-6');
    // 12000 / 15000 = 0.8
    assert.equal(sonnet.cacheHitRatio, 0.8);
  });

  test('group=skill clusters across providers', () => {
    const summary = aggregate(sampleRecords, 'skill');
    const security = summary.find((s) => s.key === 'security');
    const perf = summary.find((s) => s.key === 'performance');
    assert.equal(security.calls, 2);
    assert.equal(perf.calls, 1);
  });

  test('group=run distinguishes batches', () => {
    const summary = aggregate(sampleRecords, 'run');
    const a = summary.find((s) => s.key === 'run-a');
    const b = summary.find((s) => s.key === 'run-b');
    assert.equal(a.calls, 2);
    assert.equal(b.calls, 1);
  });

  test('returns empty array for no records', () => {
    assert.deepEqual(aggregate([], 'model'), []);
  });

  test('costs are sorted descending', () => {
    const summary = aggregate(sampleRecords, 'model');
    for (let i = 1; i < summary.length; i += 1) {
      assert.ok(summary[i - 1].usd >= summary[i].usd);
    }
  });
});

describe('usage-summary formatText', () => {
  test('renders rows with TOTAL line', () => {
    const summary = aggregate(sampleRecords, 'model');
    const out = formatText(summary, 'model');
    assert.match(out, /Group: model/);
    assert.match(out, /claude-sonnet-4-6/);
    assert.match(out, /gpt-4o-mini/);
    assert.match(out, /TOTAL/);
  });

  test('returns helpful message for empty summary', () => {
    assert.equal(formatText([], 'model'), 'no usage records');
  });
});
