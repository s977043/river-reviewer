// #878 A2-3-test slice — failing integration test for replay execution.
//
// Per docs/development/a2-3-replay-execution-design.md §"Failing test
// specification": this test locks the silent-skip contract that A2-3-impl
// must lift. It is marked { todo: true } so CI stays green while the test
// is published as the contract source-of-truth. When A2-3-impl lands and
// the assertion passes, the runner should flip this to a regular `test()`
// in the same PR.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { describe } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '../src/cli.mjs');

function makePlanFixture() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'river-a2-3-replay-'));
  const planPath = path.join(dir, 'plan.json');
  const plan = {
    version: '1',
    timestamp: '2026-05-27T22:00:00Z',
    phase: 'midstream',
    status: 'ok',
    plan: {
      selectedSkills: [{ id: 'rr-midstream-hello-skill-001', name: 'Hello Skill (Always-On Sample)' }],
      skippedSkills: [],
      plannerMode: 'off',
    },
    debug: {
      execution: {
        snapshot: {
          fileTypes: ['markdown'],
          relatedADRs: [],
          reviewMode: 'standard',
          riskAssessment: { action: 'comment_only', reason: 'docs-only change' },
        },
      },
    },
  };
  writeFileSync(planPath, JSON.stringify(plan, null, 2));
  return { dir, planPath };
}

describe('#878 A2-3 — `river review exec --plan` replay execution', () => {
  test(
    'silent-skip: --plan replay returns findings: [] when execution is requested',
    { todo: 'A2-3-impl slice will lift this. Remove the todo flag in the same PR.' },
    () => {
      const { dir, planPath } = makePlanFixture();
      try {
        const r = spawnSync(process.execPath, [CLI, 'review', 'exec', '--plan', planPath], {
          encoding: 'utf8',
          env: { ...process.env, NO_COLOR: '1' },
        });

        // Locate the JSON document in stdout (CLI may print human-readable
        // preamble; the artifact JSON is the last well-formed object).
        const jsonStart = r.stdout.lastIndexOf('{');
        assert.ok(jsonStart >= 0, `no JSON in stdout: ${r.stdout}\nstderr: ${r.stderr}`);
        const artifact = JSON.parse(r.stdout.slice(jsonStart));

        // Contract under A2-3-impl: replay invokes generateReview, returns
        // findings. With the snapshot carry-over present, at least one
        // finding (or a deliberate empty-with-explanation) must appear.
        assert.ok(
          Array.isArray(artifact.findings) && artifact.findings.length >= 1,
          `expected findings >= 1 after A2-3-impl, got ${
            Array.isArray(artifact.findings) ? artifact.findings.length : 'non-array'
          }. Today's behavior (pre-A2-3-impl) is findings: []. This test is { todo: true } until A2-3-impl lands.`
        );
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  );
});
