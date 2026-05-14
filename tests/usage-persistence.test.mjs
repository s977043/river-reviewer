import assert from 'node:assert/strict';
import test, { afterEach, beforeEach, describe } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  isUsageTelemetryEnabled,
  generateRunId,
  buildUsageRecord,
  persistUsageEvents,
} from '../src/lib/usage-persistence.mjs';

// ---------------------------------------------------------------------------
// isUsageTelemetryEnabled
// ---------------------------------------------------------------------------

describe('isUsageTelemetryEnabled', () => {
  let original;
  beforeEach(() => {
    original = process.env.RIVER_USAGE_TELEMETRY;
  });
  afterEach(() => {
    if (original === undefined) delete process.env.RIVER_USAGE_TELEMETRY;
    else process.env.RIVER_USAGE_TELEMETRY = original;
  });

  test('returns false when unset', () => {
    delete process.env.RIVER_USAGE_TELEMETRY;
    assert.equal(isUsageTelemetryEnabled(), false);
  });

  test('returns true only for exact value "1"', () => {
    process.env.RIVER_USAGE_TELEMETRY = '1';
    assert.equal(isUsageTelemetryEnabled(), true);
    process.env.RIVER_USAGE_TELEMETRY = 'true';
    assert.equal(isUsageTelemetryEnabled(), false);
    process.env.RIVER_USAGE_TELEMETRY = '0';
    assert.equal(isUsageTelemetryEnabled(), false);
  });
});

// ---------------------------------------------------------------------------
// generateRunId
// ---------------------------------------------------------------------------

describe('generateRunId', () => {
  test('returns 8 hex characters', () => {
    const id = generateRunId();
    assert.match(id, /^[0-9a-f]{8}$/);
  });

  test('is unique across calls', () => {
    const ids = new Set();
    for (let i = 0; i < 50; i += 1) ids.add(generateRunId());
    assert.equal(ids.size, 50);
  });
});

// ---------------------------------------------------------------------------
// buildUsageRecord
// ---------------------------------------------------------------------------

describe('buildUsageRecord', () => {
  test('produces a stable record from event + usage', () => {
    const record = buildUsageRecord({
      file: 'src/auth.mjs',
      skill: 'security',
      usage: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        inputTokens: 100,
        outputTokens: 50,
        cacheCreationInputTokens: 20,
        cacheReadInputTokens: 10,
      },
      runId: 'abcd1234',
      commit: 'deadbeef',
    });
    assert.equal(record.file, 'src/auth.mjs');
    assert.equal(record.skill, 'security');
    assert.equal(record.provider, 'anthropic');
    assert.equal(record.model, 'claude-sonnet-4-6');
    assert.equal(record.inputTokens, 100);
    assert.equal(record.outputTokens, 50);
    assert.equal(record.cacheCreationInputTokens, 20);
    assert.equal(record.cacheReadInputTokens, 10);
    assert.equal(record.runId, 'abcd1234');
    assert.equal(record.commit, 'deadbeef');
    assert.match(record.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  });

  test('returns null when usage is missing', () => {
    assert.equal(buildUsageRecord({ file: 'a', skill: 'b', usage: null }), null);
    assert.equal(buildUsageRecord({ file: 'a', skill: 'b' }), null);
  });

  test('defaults missing token fields to 0', () => {
    const record = buildUsageRecord({
      file: 'x',
      skill: 'y',
      usage: { provider: 'openai', model: 'gpt-4o', inputTokens: 10 },
    });
    assert.equal(record.outputTokens, 0);
    assert.equal(record.cacheCreationInputTokens, 0);
    assert.equal(record.cacheReadInputTokens, 0);
  });
});

// ---------------------------------------------------------------------------
// persistUsageEvents
// ---------------------------------------------------------------------------

describe('persistUsageEvents', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'river-usage-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('writes JSONL file under artifacts/usage/ for events with usage', async () => {
    const events = [
      {
        file: 'a.js',
        skill: 's1',
        usage: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-6',
          inputTokens: 100,
          outputTokens: 10,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 50,
        },
      },
      {
        file: 'b.js',
        skill: 's1',
        usage: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-6',
          inputTokens: 200,
          outputTokens: 20,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 80,
        },
      },
    ];

    const written = await persistUsageEvents(events, {
      rootDir: tmpDir,
      runId: 'testrun1',
      commit: 'cafebabe',
    });

    assert.ok(written);
    assert.ok(written.includes(path.join('artifacts', 'usage')));
    assert.ok(written.endsWith('-testrun1.jsonl'));

    const body = await fs.readFile(written, 'utf8');
    const lines = body.trim().split('\n');
    assert.equal(lines.length, 2);
    const first = JSON.parse(lines[0]);
    assert.equal(first.file, 'a.js');
    assert.equal(first.inputTokens, 100);
    assert.equal(first.cacheReadInputTokens, 50);
    assert.equal(first.runId, 'testrun1');
    assert.equal(first.commit, 'cafebabe');
  });

  test('returns null and writes nothing when no event has usage', async () => {
    const written = await persistUsageEvents(
      [
        { file: 'a.js', skill: 's' },
        { file: 'b.js', skill: 's', error: 'boom' },
      ],
      { rootDir: tmpDir },
    );
    assert.equal(written, null);
    const dir = path.join(tmpDir, 'artifacts', 'usage');
    const exists = await fs
      .stat(dir)
      .then(() => true)
      .catch(() => false);
    // Directory may or may not exist depending on early-return — either way,
    // assert no files were written.
    if (exists) {
      const files = await fs.readdir(dir);
      assert.equal(files.length, 0);
    }
  });

  test('creates artifacts/usage directory when missing', async () => {
    const written = await persistUsageEvents(
      [
        {
          file: 'a.js',
          skill: 's',
          usage: {
            provider: 'openai',
            model: 'gpt-4o',
            inputTokens: 1,
            outputTokens: 1,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
          },
        },
      ],
      { rootDir: tmpDir, runId: 'mkdirtest' },
    );
    assert.ok(written);
    const stat = await fs.stat(path.dirname(written));
    assert.ok(stat.isDirectory());
  });
});
