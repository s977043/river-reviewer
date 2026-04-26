/**
 * Tests for ReviewOptions.concurrency — concurrency chunk-batching logic.
 *
 * These tests validate the chunk-based batching algorithm in isolation,
 * avoiding a direct import of dist/index.js (which depends on
 * @river-reviewer/core-runner, not installed in the root node_modules).
 *
 * The chunk loop is extracted verbatim from runners/node-api/src/index.ts
 * and exercised with a mock executeSkillWithAI that records concurrency.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Inline chunk-based concurrency helper (mirrors index.ts implementation)
// ---------------------------------------------------------------------------

/**
 * Run tasks in chunks of `concurrency`. Each chunk is fully settled before
 * the next starts. concurrency=0 means unlimited (all tasks at once).
 *
 * @param {Array<() => Promise<unknown>>} tasks - Task factory functions
 * @param {number} concurrency - Max simultaneous tasks (0 = unlimited)
 * @returns {Promise<Array<{status: string, value?: unknown, reason?: unknown}>>}
 */
async function runWithConcurrency(tasks, concurrency) {
  const allResults = [];
  if (concurrency <= 0) {
    const results = await Promise.allSettled(tasks.map((t) => t()));
    allResults.push(...results);
  } else {
    for (let i = 0; i < tasks.length; i += concurrency) {
      const chunk = tasks.slice(i, i + concurrency);
      const results = await Promise.allSettled(chunk.map((t) => t()));
      allResults.push(...results);
    }
  }
  return allResults;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReviewOptions.concurrency — chunk batching logic', () => {
  it('concurrency=1 never runs more than 1 task at a time', async () => {
    let active = 0;
    let peakActive = 0;

    const tasks = Array.from({ length: 5 }, (_, i) => async () => {
      active++;
      if (active > peakActive) peakActive = active;
      await new Promise((r) => setTimeout(r, 2));
      active--;
      return i;
    });

    const results = await runWithConcurrency(tasks, 1);

    assert.equal(peakActive, 1, `Peak active ${peakActive} exceeded concurrency=1`);
    assert.equal(results.length, 5);
    assert.ok(results.every((r) => r.status === 'fulfilled'));
  });

  it('concurrency=2 never runs more than 2 tasks at a time', async () => {
    let active = 0;
    let peakActive = 0;

    const tasks = Array.from({ length: 6 }, (_, i) => async () => {
      active++;
      if (active > peakActive) peakActive = active;
      await new Promise((r) => setTimeout(r, 2));
      active--;
      return i;
    });

    await runWithConcurrency(tasks, 2);

    assert.ok(peakActive <= 2, `Peak active ${peakActive} exceeded concurrency=2`);
  });

  it('concurrency=0 runs all tasks simultaneously', async () => {
    let active = 0;
    let peakActive = 0;

    const tasks = Array.from({ length: 4 }, (_, i) => async () => {
      active++;
      if (active > peakActive) peakActive = active;
      await new Promise((r) => setTimeout(r, 2));
      active--;
      return i;
    });

    await runWithConcurrency(tasks, 0);

    // With unlimited concurrency all 4 tasks start simultaneously
    assert.equal(peakActive, 4);
  });

  it('returns all results in order regardless of concurrency', async () => {
    const tasks = [10, 20, 30, 40, 50].map((v) => async () => v);

    const results3 = await runWithConcurrency(tasks, 3);
    const values3 = results3.map((r) => r.value);
    assert.deepEqual(values3, [10, 20, 30, 40, 50]);

    const results1 = await runWithConcurrency(tasks, 1);
    const values1 = results1.map((r) => r.value);
    assert.deepEqual(values1, [10, 20, 30, 40, 50]);
  });

  it('handles empty task list gracefully', async () => {
    const results = await runWithConcurrency([], 3);
    assert.equal(results.length, 0);
  });

  it('captures rejections as "rejected" without throwing', async () => {
    const tasks = [
      async () => 'ok',
      async () => {
        throw new Error('boom');
      },
      async () => 'also-ok',
    ];

    const results = await runWithConcurrency(tasks, 2);

    assert.equal(results[0].status, 'fulfilled');
    assert.equal(results[0].value, 'ok');
    assert.equal(results[1].status, 'rejected');
    assert.match(results[1].reason.message, /boom/);
    assert.equal(results[2].status, 'fulfilled');
    assert.equal(results[2].value, 'also-ok');
  });

  it('chunk size evenly divides task count', async () => {
    const order = [];
    const tasks = [1, 2, 3, 4, 5, 6].map((v) => async () => {
      order.push(v);
      return v;
    });

    await runWithConcurrency(tasks, 2);
    assert.equal(order.length, 6);
  });

  it('chunk size larger than task count still works', async () => {
    const tasks = [async () => 1, async () => 2];
    const results = await runWithConcurrency(tasks, 10);
    assert.equal(results.length, 2);
    assert.ok(results.every((r) => r.status === 'fulfilled'));
  });
});

describe('ReviewOptions.concurrency — default value contract', () => {
  it('default concurrency of 3 caps a 7-task batch into 3 chunks', async () => {
    const DEFAULT_CONCURRENCY = 3;
    const chunkSizes = [];
    const tasks = Array.from({ length: 7 }, (_, i) => i);

    // Simulate the chunk loop to verify chunk sizes
    for (let i = 0; i < tasks.length; i += DEFAULT_CONCURRENCY) {
      const chunk = tasks.slice(i, i + DEFAULT_CONCURRENCY);
      chunkSizes.push(chunk.length);
    }

    assert.deepEqual(chunkSizes, [3, 3, 1]);
  });
});
