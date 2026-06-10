import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'url';

import { createTempDirAsync } from './helpers/temp-dir.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(repoRoot, 'scripts', 'compare-eval-ledger.mjs');

function entry({ fpRate, scores = { fixtures_recall: 1 } }) {
  return {
    version: '1.0.0',
    timestamp: '2026-06-11T00:00:00Z',
    commit: 'abc1234',
    branch: 'main',
    scores,
    snapshots: {
      perSkillFp: {
        'rr-midstream-typescript-strict-001': { guards: 10, fps: fpRate * 10, fpRate },
      },
    },
    results: [],
    status: 'pass',
  };
}

async function writeLedger(entries) {
  const dir = await createTempDirAsync({ prefix: 'fp-ledger-' });
  const file = path.join(dir, 'results.jsonl');
  await fs.writeFile(file, entries.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
  return file;
}

function run(ledger) {
  try {
    const stdout = execFileSync('node', [script, '--ledger', ledger, '--json'], {
      encoding: 'utf8',
    });
    return { code: 0, out: JSON.parse(stdout) };
  } catch (err) {
    return { code: err.status, out: JSON.parse(err.stdout) };
  }
}

test('per-skill FP worsening beyond +3pt flags a regression (exit 1)', async () => {
  const ledger = await writeLedger([entry({ fpRate: 0.05 }), entry({ fpRate: 0.1 })]);
  const { code, out } = run(ledger);
  assert.equal(code, 1);
  assert.equal(out.regression, true);
  assert.equal(out.perSkillFpRegressions.length, 1);
  assert.equal(out.perSkillFpRegressions[0].id, 'rr-midstream-typescript-strict-001');
});

test('per-skill FP change within +3pt stays informational (exit 0)', async () => {
  const ledger = await writeLedger([entry({ fpRate: 0.05 }), entry({ fpRate: 0.07 })]);
  const { code, out } = run(ledger);
  assert.equal(code, 0);
  assert.equal(out.regression, false);
  assert.equal(out.perSkillFpRegressions.length, 0);
  assert.equal(out.perSkillFp.length, 1, 'change is still reported informationally');
});

test('per-skill FP improvement never regresses', async () => {
  const ledger = await writeLedger([entry({ fpRate: 0.2 }), entry({ fpRate: 0.05 })]);
  const { code } = run(ledger);
  assert.equal(code, 0);
});
