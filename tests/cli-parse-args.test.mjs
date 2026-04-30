// tests/cli-parse-args.test.mjs
//
// parseArgs の純粋関数テスト。
// 子プロセスを起動せず、同期的に parse 結果を検証することで高速化する。
// 各テストは < 50ms で完走する想定。

import assert from 'node:assert/strict';
import test from 'node:test';

import { parseArgs } from '../src/cli.mjs';

// parseArgs は process.env を参照してデフォルト値を決めるため、
// 環境変数がテスト結果に影響しないよう一時的にクリアする。
function withCleanEnv(fn) {
  const keys = ['RIVER_PHASE', 'RIVER_PLANNER_MODE'];
  const backup = {};
  for (const key of keys) {
    backup[key] = process.env[key];
    delete process.env[key];
  }
  try {
    return fn();
  } finally {
    for (const key of keys) {
      if (backup[key] === undefined) delete process.env[key];
      else process.env[key] = backup[key];
    }
  }
}

// -----------------------------------------------------------------------------
// Defaults and commands
// -----------------------------------------------------------------------------

test('parseArgs: empty argv leaves command null and defaults applied', () => {
  withCleanEnv(() => {
    const parsed = parseArgs([]);
    assert.equal(parsed.command, null);
    assert.equal(parsed.target, '.');
    assert.equal(parsed.phase, 'midstream');
    assert.equal(parsed.plannerMode, 'off');
    assert.equal(parsed.dryRun, false);
    assert.equal(parsed.debug, false);
    assert.equal(parsed.estimate, false);
    assert.equal(parsed.maxCost, null);
    assert.equal(parsed.output, 'text');
  });
});

test('parseArgs: run command with default target', () => {
  const parsed = parseArgs(['run']);
  assert.equal(parsed.command, 'run');
  assert.equal(parsed.target, '.');
});

test('parseArgs: run command with explicit target path', () => {
  const parsed = parseArgs(['run', '/tmp/myrepo']);
  assert.equal(parsed.command, 'run');
  assert.equal(parsed.target, '/tmp/myrepo');
});

test('parseArgs: doctor command', () => {
  const parsed = parseArgs(['doctor', '.']);
  assert.equal(parsed.command, 'doctor');
  assert.equal(parsed.target, '.');
});

test('parseArgs: eval command sets command without target', () => {
  const parsed = parseArgs(['eval']);
  assert.equal(parsed.command, 'eval');
});

test('parseArgs: skills list subcommand', () => {
  const parsed = parseArgs(['skills', 'list']);
  assert.equal(parsed.command, 'skills');
  assert.equal(parsed.skillsSubcommand, 'list');
});

test('parseArgs: skills import subcommand with --from', () => {
  const parsed = parseArgs(['skills', 'import', '--from', '/some/path']);
  assert.equal(parsed.command, 'skills');
  assert.equal(parsed.skillsSubcommand, 'import');
  assert.equal(parsed.fromPath, '/some/path');
});

test('parseArgs: skills export subcommand with --to and --include-assets', () => {
  const parsed = parseArgs(['skills', 'export', '--to', '/out', '--include-assets']);
  assert.equal(parsed.skillsSubcommand, 'export');
  assert.equal(parsed.toPath, '/out');
  assert.equal(parsed.includeAssets, true);
});

// -----------------------------------------------------------------------------
// Boolean flags
// -----------------------------------------------------------------------------

test('parseArgs: --dry-run sets dryRun true', () => {
  const parsed = parseArgs(['run', '.', '--dry-run']);
  assert.equal(parsed.dryRun, true);
});

test('parseArgs: --debug sets debug true', () => {
  const parsed = parseArgs(['run', '.', '--debug']);
  assert.equal(parsed.debug, true);
});

test('parseArgs: --estimate sets estimate true', () => {
  const parsed = parseArgs(['run', '.', '--estimate']);
  assert.equal(parsed.estimate, true);
});

test('parseArgs: --verbose sets verbose true', () => {
  const parsed = parseArgs(['eval', '--verbose']);
  assert.equal(parsed.verbose, true);
});

// -----------------------------------------------------------------------------
// Options with values
// -----------------------------------------------------------------------------

test('parseArgs: --phase downstream', () => {
  const parsed = parseArgs(['run', '.', '--phase', 'downstream']);
  assert.equal(parsed.phase, 'downstream');
});

test('parseArgs: --phase without value falls back to help', () => {
  const parsed = parseArgs(['run', '.', '--phase']);
  assert.equal(parsed.command, 'help');
});

test('parseArgs: --planner order', () => {
  const parsed = parseArgs(['run', '.', '--planner', 'order']);
  assert.equal(parsed.plannerMode, 'order');
});

test('parseArgs: --planner invalid value falls back to help', () => {
  const parsed = parseArgs(['run', '.', '--planner', 'bogus']);
  assert.equal(parsed.command, 'help');
});

test('parseArgs: --output markdown', () => {
  const parsed = parseArgs(['run', '.', '--output', 'markdown']);
  assert.equal(parsed.output, 'markdown');
});

test('parseArgs: --output invalid value falls back to help', () => {
  const parsed = parseArgs(['run', '.', '--output', 'xml']);
  assert.equal(parsed.command, 'help');
});

test('parseArgs: --max-cost accepts positive decimal', () => {
  const parsed = parseArgs(['run', '.', '--max-cost', '0.25']);
  assert.equal(parsed.maxCost, 0.25);
});

test('parseArgs: --max-cost rejects negative value', () => {
  const parsed = parseArgs(['run', '.', '--max-cost', '-1']);
  assert.equal(parsed.command, 'help');
});

test('parseArgs: --max-cost rejects non-numeric value', () => {
  const parsed = parseArgs(['run', '.', '--max-cost', 'free']);
  assert.equal(parsed.command, 'help');
});

test('parseArgs: --context comma list', () => {
  const parsed = parseArgs(['run', '.', '--context', 'diff,fullFile,tests']);
  assert.deepEqual(parsed.availableContexts, ['diff', 'fullFile', 'tests']);
});

test('parseArgs: --dependency comma list', () => {
  const parsed = parseArgs(['run', '.', '--dependency', 'code_search,test_runner']);
  assert.deepEqual(parsed.availableDependencies, ['code_search', 'test_runner']);
});

test('parseArgs: --cases path for eval', () => {
  const parsed = parseArgs(['eval', '--cases', 'custom-cases.json']);
  assert.equal(parsed.fixturesCasesPath, 'custom-cases.json');
});

// -----------------------------------------------------------------------------
// skills import options
// -----------------------------------------------------------------------------

test('parseArgs: --strict sets validationMode strict', () => {
  const parsed = parseArgs(['skills', 'import', '--strict']);
  assert.equal(parsed.validationMode, 'strict');
});

test('parseArgs: --loose sets validationMode loose', () => {
  const parsed = parseArgs(['skills', 'import', '--loose']);
  assert.equal(parsed.validationMode, 'loose');
});

test('parseArgs: --source rr', () => {
  const parsed = parseArgs(['skills', 'list', '--source', 'rr']);
  assert.equal(parsed.listSource, 'rr');
});

test('parseArgs: --source invalid value falls back to help', () => {
  const parsed = parseArgs(['skills', 'list', '--source', 'wrong']);
  assert.equal(parsed.command, 'help');
});

// -----------------------------------------------------------------------------
// Help flag
// -----------------------------------------------------------------------------

test('parseArgs: -h triggers help command', () => {
  const parsed = parseArgs(['-h']);
  assert.equal(parsed.command, 'help');
});

test('parseArgs: --help triggers help command', () => {
  const parsed = parseArgs(['--help']);
  assert.equal(parsed.command, 'help');
});

// -----------------------------------------------------------------------------
// Environment variable defaults
// -----------------------------------------------------------------------------

test('parseArgs: RIVER_PHASE env overrides default phase', () => {
  const backup = process.env.RIVER_PHASE;
  process.env.RIVER_PHASE = 'upstream';
  try {
    const parsed = parseArgs([]);
    assert.equal(parsed.phase, 'upstream');
  } finally {
    if (backup === undefined) delete process.env.RIVER_PHASE;
    else process.env.RIVER_PHASE = backup;
  }
});

test('parseArgs: explicit --phase overrides RIVER_PHASE env', () => {
  const backup = process.env.RIVER_PHASE;
  process.env.RIVER_PHASE = 'upstream';
  try {
    const parsed = parseArgs(['run', '.', '--phase', 'downstream']);
    assert.equal(parsed.phase, 'downstream');
  } finally {
    if (backup === undefined) delete process.env.RIVER_PHASE;
    else process.env.RIVER_PHASE = backup;
  }
});

// -----------------------------------------------------------------------------
// suppression subcommand (#687 PR-D)
// -----------------------------------------------------------------------------

test('parseArgs: suppression add captures all flags', () => {
  const parsed = parseArgs([
    'suppression',
    'add',
    '--fingerprint',
    'a'.repeat(16),
    '--feedback',
    'false_positive',
    '--rationale',
    'flagged but acceptable in this codebase',
    '--scope',
    'subsystem',
    '--severity',
    'minor',
    '--files',
    'src/auth.ts,src/login.ts',
    '--pr',
    '123',
  ]);
  assert.equal(parsed.command, 'suppression');
  assert.equal(parsed.suppressionSubcommand, 'add');
  assert.equal(parsed.suppressionFingerprint, 'a'.repeat(16));
  assert.equal(parsed.suppressionFeedbackType, 'false_positive');
  assert.equal(parsed.suppressionRationale, 'flagged but acceptable in this codebase');
  assert.equal(parsed.suppressionScope, 'subsystem');
  assert.equal(parsed.suppressionSeverity, 'minor');
  assert.deepEqual(parsed.suppressionFiles, ['src/auth.ts', 'src/login.ts']);
  assert.equal(parsed.suppressionPrNumber, 123);
});

test('parseArgs: suppression add defaults scope to file', () => {
  const parsed = parseArgs([
    'suppression',
    'add',
    '--fingerprint',
    'b'.repeat(16),
    '--feedback',
    'accepted_risk',
    '--rationale',
    'accepted',
  ]);
  assert.equal(parsed.suppressionScope, 'file');
});

test('parseArgs: suppression add silently drops non-positive --pr', () => {
  // Non-positive values are silently dropped (suppressionPrNumber stays null).
  const parsed = parseArgs([
    'suppression',
    'add',
    '--fingerprint',
    'c'.repeat(16),
    '--feedback',
    'false_positive',
    '--rationale',
    'r',
    '--pr',
    '0',
  ]);
  assert.equal(parsed.suppressionPrNumber, null);
});
