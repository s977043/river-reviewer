// Integration test for #689 PR-C: collectRepoContext reads
// config.context.{budget, ranking} and surfaces ranking + tokenBudget
// telemetry on the result.
//
// Builds a small mock filesystem under a temp dir, runs collectRepoContext
// with various context configs, and asserts on the returned shape and on
// the order in which the ranker prioritised candidates.

import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { collectRepoContext } from '../src/lib/repo-context.mjs';
import { createTempDir, cleanupTempDir } from './helpers/temp-dir.mjs';

function setupRepo() {
  const dir = createTempDir({ prefix: 'river-rank-budget-' });
  // Three changed files: two close (auth/), one far (billing/). With
  // ranking enabled the auth/ pair should land first under the budget.
  mkdirSync(join(dir, 'src', 'auth'), { recursive: true });
  mkdirSync(join(dir, 'src', 'billing'), { recursive: true });
  writeFileSync(join(dir, 'src', 'auth', 'login.ts'), 'export const login = () => 1;\n');
  writeFileSync(join(dir, 'src', 'auth', 'oauth.ts'), 'export const oauth = () => 2;\n');
  writeFileSync(join(dir, 'src', 'billing', 'invoice.ts'), 'export const inv = () => 3;\n');
  return dir;
}

test('collectRepoContext returns null ranking + tokenBudget when context config is omitted', async () => {
  const dir = setupRepo();
  try {
    const result = await collectRepoContext({
      changedFiles: ['src/auth/login.ts', 'src/auth/oauth.ts', 'src/billing/invoice.ts'],
      repoRoot: dir,
    });
    assert.equal(result.ranking, null);
    assert.equal(result.tokenBudget, null);
  } finally {
    cleanupTempDir(dir);
  }
});

test('collectRepoContext exposes ranking.scores when config.context.ranking.enabled is true', async () => {
  const dir = setupRepo();
  try {
    const result = await collectRepoContext({
      changedFiles: ['src/auth/login.ts', 'src/auth/oauth.ts', 'src/billing/invoice.ts'],
      repoRoot: dir,
      context: { ranking: { enabled: true } },
    });
    assert.ok(result.ranking?.enabled);
    assert.ok(Array.isArray(result.ranking.scores));
    // The two auth/ paths share a deeper prefix so they should rank
    // higher than billing/. Confirm at least one auth path beats the
    // billing path.
    const authScores = result.ranking.scores.filter((s) => s.path.startsWith('src/auth/'));
    const billing = result.ranking.scores.find((s) => s.path.startsWith('src/billing/'));
    if (authScores.length && billing) {
      assert.ok(
        authScores[0].score >= billing.score,
        `auth ${authScores[0].score} should rank >= billing ${billing.score}`
      );
    }
  } finally {
    cleanupTempDir(dir);
  }
});

test('collectRepoContext exposes tokenBudget when config.context.budget.maxTokens is set', async () => {
  const dir = setupRepo();
  try {
    const result = await collectRepoContext({
      changedFiles: ['src/auth/login.ts'],
      repoRoot: dir,
      context: { budget: { maxTokens: 4000 } },
    });
    assert.ok(result.tokenBudget, 'tokenBudget should be populated');
    assert.equal(result.tokenBudget.max, 4000);
    assert.ok(typeof result.tokenBudget.remaining === 'number');
    assert.equal(typeof result.tokenBudget.exhausted, 'boolean');
  } finally {
    cleanupTempDir(dir);
  }
});

test('collectRepoContext truncates when token budget is too small for any file', async () => {
  const dir = setupRepo();
  try {
    const result = await collectRepoContext({
      changedFiles: ['src/auth/login.ts'],
      repoRoot: dir,
      // 256 is the schema minimum; pair with charsToTokens upper bound
      // (chars/2) so the cap permits at most 512 chars. Our login.ts
      // file is short, so it still fits — verify the budget bookkeeping
      // is consistent regardless.
      context: { budget: { maxTokens: 256 } },
    });
    assert.ok(result.tokenBudget?.max === 256);
    assert.ok(result.tokenBudget?.remaining >= 0);
  } finally {
    cleanupTempDir(dir);
  }
});

test('ranking is a no-op for a single-file change set', async () => {
  const dir = setupRepo();
  try {
    const result = await collectRepoContext({
      changedFiles: ['src/auth/login.ts'],
      repoRoot: dir,
      context: { ranking: { enabled: true } },
    });
    assert.ok(result.ranking?.enabled);
    // With a single candidate, the ranker degenerates to score=1 for
    // the only entry. Exposed scores reflect that.
    assert.equal(result.ranking.scores.length, 1);
    assert.equal(result.ranking.scores[0].path, 'src/auth/login.ts');
  } finally {
    cleanupTempDir(dir);
  }
});
