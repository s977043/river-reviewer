// tests/integration/review-plan-cli.test.mjs
//
// `river review plan --plan-only` の CLI 統合 E2E (#802 Phase 3 slice 2)。
//
// slice 1 (#839) で配線した公開エントリポイントを、PlanGate 風の artifact
// fixture に対して end-to-end で検証する。skill/planner 実行・破壊的契約変更
// は対象外。resolver の網羅的優先順テストは tests/artifact-resolver.test.mjs
// が担い、ここは「CLI として通る」代表ケースに絞る。
//
// 出力捕捉の注意: src/cli.mjs の review plan は --output-file 未指定時
// process.stdout.write で JSON を書き出す。runCliInProcess は console のみ
// 捕捉し process.stdout.write を捕捉しない（helpers/cli.mjs 参照）ため、
// in-process E2E は --output-file + ファイル読取で検証し、stdout 直接出力の
// 検証は runCliAsSubprocess を 1 本使う。
// (技術的負債: --output-file 非依存の stdout 捕捉は別 slice で扱う。)

import assert from 'node:assert/strict';
import { mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import test, { describe } from 'node:test';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import { runCliInProcess, runCliAsSubprocess } from '../helpers/cli.mjs';
import { createTempDir, cleanupTempDir } from '../helpers/temp-dir.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = resolve(__dirname, '..', 'fixtures', 'plangate-review-artifacts');
const schema = JSON.parse(
  readFileSync(resolve(__dirname, '..', '..', 'schemas', 'review-artifact.schema.json'), 'utf8')
);

function makeValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

/** Lay the PlanGate fixture out into a fresh temp repo root. */
function setupRepo(t, { withConfig = false } = {}) {
  const dir = createTempDir({ prefix: 'rr-review-plan-e2e-' });
  t.after(() => cleanupTempDir(dir));
  for (const f of ['plan.md', 'todo.md', 'todo-from-config.md', 'diff.patch']) {
    copyFileSync(join(FIXTURE, f), join(dir, f));
  }
  if (withConfig) {
    copyFileSync(join(FIXTURE, 'config', '.river-reviewer.json'), join(dir, '.river-reviewer.json'));
  }
  return dir;
}

describe('river review plan --plan-only — CLI E2E (#802 Phase 3)', () => {
  test('emits a schema-valid v1 Review Artifact to --output-file (exit 0)', async (t) => {
    const dir = setupRepo(t);
    const out = join(dir, 'review-artifact.json');
    const result = await runCliInProcess(
      ['review', 'plan', '--plan-only', '--phase', 'upstream', '--output-file', out],
      { cwd: dir }
    );
    assert.equal(result.code, 0, result.stderr);

    const artifact = JSON.parse(readFileSync(out, 'utf8'));
    const validate = makeValidator();
    assert.equal(validate(artifact), true, JSON.stringify(validate.errors));
    assert.equal(artifact.version, '1');
    assert.equal(artifact.phase, 'upstream');
    assert.equal(artifact.status, 'ok');
    assert.deepEqual(artifact.findings, []);
    assert.equal(artifact.plan.plannerMode, 'off');
    assert.equal('debug' in artifact, false);
  });

  test('--debug attaches resolvedArtifacts with cwd-default resolution', async (t) => {
    const dir = setupRepo(t);
    const out = join(dir, 'a.json');
    const result = await runCliInProcess(
      ['review', 'plan', '--plan-only', '--phase', 'upstream', '--debug', '--output-file', out],
      { cwd: dir }
    );
    assert.equal(result.code, 0, result.stderr);

    const artifact = JSON.parse(readFileSync(out, 'utf8'));
    assert.equal(makeValidator()(artifact), true);
    const resolved = artifact.debug.resolvedArtifacts;
    assert.equal(resolved.plan.source, 'cwd');
    assert.equal(resolved.plan.exists, true);
    assert.ok(resolved.plan.path.endsWith('plan.md'));
    // No config, no CLI override: todo also resolves via cwd default.
    assert.equal(resolved.todo.source, 'cwd');
    // An unconfigured, absent artifact resolves to null/source:null.
    assert.equal(resolved.coverage.source, null);
    assert.equal(resolved.coverage.exists, false);
  });

  test('config tier wins over cwd default; CLI --artifact wins over config', async (t) => {
    const dir = setupRepo(t, { withConfig: true });

    // Config only: artifacts.todo → todo-from-config.md (config tier).
    const out1 = join(dir, 'cfg.json');
    const r1 = await runCliInProcess(
      ['review', 'plan', '--plan-only', '--phase', 'upstream', '--debug', '--output-file', out1],
      { cwd: dir }
    );
    assert.equal(r1.code, 0, r1.stderr);
    const a1 = JSON.parse(readFileSync(out1, 'utf8'));
    assert.equal(a1.debug.resolvedArtifacts.todo.source, 'config');
    assert.ok(a1.debug.resolvedArtifacts.todo.path.endsWith('todo-from-config.md'));

    // CLI --artifact overrides the config tier.
    const out2 = join(dir, 'cli.json');
    const r2 = await runCliInProcess(
      [
        'review',
        'plan',
        '--plan-only',
        '--phase',
        'upstream',
        '--artifact',
        'todo=todo.md',
        '--debug',
        '--output-file',
        out2,
      ],
      { cwd: dir }
    );
    assert.equal(r2.code, 0, r2.stderr);
    const a2 = JSON.parse(readFileSync(out2, 'utf8'));
    assert.equal(a2.debug.resolvedArtifacts.todo.source, 'cli');
    assert.ok(a2.debug.resolvedArtifacts.todo.path.endsWith('todo.md'));
  });

  test('invalid --phase exits 3', async (t) => {
    const dir = setupRepo(t);
    const result = await runCliInProcess(
      ['review', 'plan', '--plan-only', '--phase', 'bogus'],
      { cwd: dir }
    );
    assert.equal(result.code, 3);
    assert.match(result.stderr, /Invalid --phase/);
  });

  test('missing --plan-only exits 3', async (t) => {
    const dir = setupRepo(t);
    const result = await runCliInProcess(['review', 'plan', '--phase', 'upstream'], { cwd: dir });
    assert.equal(result.code, 3);
  });

  // One real-subprocess case: exercises actual process.stdout.write +
  // process exit code (which runCliInProcess cannot observe for stdout).
  test('writes a parseable Review Artifact to stdout via subprocess (exit 0)', async (t) => {
    const dir = setupRepo(t);
    const result = await runCliAsSubprocess(
      ['review', 'plan', '--plan-only', '--phase', 'midstream'],
      { cwd: dir }
    );
    assert.equal(result.code, 0, result.stderr);
    const artifact = JSON.parse(result.stdout);
    assert.equal(makeValidator()(artifact), true, JSON.stringify(artifact));
    assert.equal(artifact.phase, 'midstream');
    assert.equal(artifact.status, 'ok');
  });
});
