// tests/cli.test.mjs
//
// river CLI の end-to-end テスト。
// 通常は runCliInProcess() で in-process 実行し、subprocess 経由が必要な
// テスト（process.exitCode の厳密検証）だけ runCliAsSubprocess() を使う。
//
// グルーピング:
//   - river run - dry-run outputs
//   - river run - markdown output
//   - river run - guards & error paths
//   - river doctor
//   - river skills subcommands
//
// 重複していた createRepoWithChange / runCli / runGit は
// tests/helpers/ に統合済み。

import assert from 'node:assert';
import { mkdirSync, writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import test, { describe } from 'node:test';

import { runCliAsSubprocess, runCliInProcess } from './helpers/cli.mjs';
import {
  createTempGitRepo,
  createRepoWithSilentCatchChange,
  runGit,
} from './helpers/temp-repo.mjs';
import { createTempDir, cleanupTempDirAsync } from './helpers/temp-dir.mjs';

// -----------------------------------------------------------------------------
// river run - dry-run outputs
// -----------------------------------------------------------------------------

describe('river run - dry-run outputs', () => {
  test('emits review comments in dry-run mode', async (t) => {
    const { dir, cleanup } = await createRepoWithSilentCatchChange();
    t.after(cleanup);

    const result = await runCliInProcess(['run', '.', '--dry-run', '--debug'], { cwd: dir });

    assert.strictEqual(result.code, 0, result.stderr);
    assert.match(result.stdout, /River Reviewer/);
    assert.match(result.stdout, /Review comments/);
    assert.match(result.stdout, /src\/app.js:/);
    assert.match(result.stdout, /LLM:/);
    assert.match(result.stdout, /Changed files/);
  });

  test('falls back gracefully without API key', async (t) => {
    const { dir, cleanup } = await createRepoWithSilentCatchChange();
    t.after(cleanup);

    const result = await runCliInProcess(['run', '.', '--debug'], { cwd: dir });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.match(result.stdout, /River Reviewer/);
    assert.match(result.stdout, /LLM: OPENAI_API_KEY/i);
    assert.match(result.stdout, /Planner: off/i);
    assert.match(result.stdout, /Review comments/);
  });

  test('reports planner skip reason when requested without API key', async (t) => {
    const { dir, cleanup } = await createRepoWithSilentCatchChange();
    t.after(cleanup);

    const result = await runCliInProcess(['run', '.', '--planner', 'order', '--debug'], {
      cwd: dir,
    });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.match(result.stdout, /Planner: order skipped/i);
    assert.match(result.stdout, /OPENAI_API_KEY/i);
  });

  test('injects project rules into prompt when present', async (t) => {
    const { dir, cleanup } = await createRepoWithSilentCatchChange();
    t.after(cleanup);

    const rulesDir = join(dir, '.river');
    mkdirSync(rulesDir, { recursive: true });
    writeFileSync(join(rulesDir, 'rules.md'), '- Use App Router\n- Prefer server components');

    const result = await runCliInProcess(['run', '.', '--dry-run', '--debug'], { cwd: dir });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.match(result.stdout, /Project rules: present/);
    assert.match(result.stdout, /Project-specific review rules/i);
  });

  test('reports when there are no changes', async (t) => {
    const { dir, cleanup } = await createRepoWithSilentCatchChange();
    t.after(cleanup);

    await runGit(['add', '.'], dir);
    await runGit(['commit', '-m', 'apply change'], dir);

    const result = await runCliInProcess(['run', '.'], { cwd: dir });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.match(result.stdout, /No changes to review/);
  });
});

// -----------------------------------------------------------------------------
// river run - markdown output
// -----------------------------------------------------------------------------

describe('river run - markdown output', () => {
  test('supports markdown output for PR comments', async (t) => {
    const { dir, cleanup } = await createRepoWithSilentCatchChange();
    t.after(cleanup);

    const result = await runCliInProcess(['run', '.', '--dry-run', '--output', 'markdown'], {
      cwd: dir,
    });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.match(result.stdout, /^<!-- river-reviewer -->/);
    assert.match(result.stdout, /## River Reviewer/);
    assert.match(result.stdout, /### 指摘/);
    // skill id はサニタイズでハイフンがエスケープされる
    assert.match(result.stdout, /#### 🔍 rr\\-midstream\\-logging\\-observability\\-001/);
    assert.doesNotMatch(result.stdout, /--- diff preview ---/);
    assert.match(result.stderr, /River Reviewer \(local\)/);
  });

  test('writes debug output to stderr when markdown output is selected', async (t) => {
    const { dir, cleanup } = await createRepoWithSilentCatchChange();
    t.after(cleanup);

    const result = await runCliInProcess(
      ['run', '.', '--dry-run', '--output', 'markdown', '--debug'],
      { cwd: dir }
    );
    assert.strictEqual(result.code, 0, result.stderr);
    assert.doesNotMatch(result.stdout, /--- diff preview ---/);
    assert.match(result.stderr, /--- diff preview ---/);
  });
});

// -----------------------------------------------------------------------------
// river run - guards & error paths
// -----------------------------------------------------------------------------

describe('river run - guards & error paths', () => {
  test('skips when PR labels match exclude list', async (t) => {
    const { dir, cleanup } = await createRepoWithSilentCatchChange();
    t.after(cleanup);

    const configPath = join(dir, '.river-reviewer.json');
    writeFileSync(
      configPath,
      JSON.stringify({ exclude: { prLabelsToIgnore: ['skip-review'] } }, null, 2),
      'utf8'
    );

    const result = await runCliInProcess(['run', '.'], {
      cwd: dir,
      env: { RIVER_PR_LABELS: 'skip-review' },
    });

    assert.strictEqual(result.code, 0, result.stderr);
    assert.match(result.stdout, /Review skipped: PR labels matched exclude patterns/);
  });

  test('supports cost estimation only', async (t) => {
    const { dir, cleanup } = await createRepoWithSilentCatchChange();
    t.after(cleanup);

    const result = await runCliInProcess(['run', '.', '--estimate'], { cwd: dir });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.match(result.stdout, /Cost Estimate/);
  });

  test('aborts when max-cost is exceeded', async (t) => {
    const { dir, cleanup } = await createRepoWithSilentCatchChange();
    t.after(cleanup);

    const result = await runCliInProcess(['run', '.', '--max-cost', '0.0001'], { cwd: dir });
    assert.notStrictEqual(result.code, 0);
    assert.match(result.stdout + result.stderr, /exceeds max-cost/i);
  });

  test('rejects negative max-cost value', async (t) => {
    const { dir, cleanup } = await createRepoWithSilentCatchChange();
    t.after(cleanup);

    const result = await runCliInProcess(['run', '.', '--max-cost', '-1'], { cwd: dir });
    assert.strictEqual(result.code, 0);
    assert.match(result.stderr, /requires a non-negative numeric value/i);
  });

  test('skips markdown-only changes after optimization', async (t) => {
    const { dir, cleanup } = await createTempGitRepo({
      prefix: 'river-cli-md-',
      initialFiles: { 'README.md': '# first\n' },
      changedFiles: { 'README.md': '# second\n' },
    });
    t.after(cleanup);

    const result = await runCliInProcess(['run', '.', '--dry-run'], { cwd: dir });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.match(result.stdout, /No changes to review/);
  });

  test('fails gracefully outside git repos', async (t) => {
    const dir = createTempDir({ prefix: 'river-cli-empty-' });
    t.after(() => cleanupTempDirAsync(dir));
    mkdirSync(resolve(dir, 'nested'));

    const result = await runCliInProcess(['run', '.'], { cwd: dir });
    assert.notStrictEqual(result.code, 0);
    assert.match(result.stderr, /Not a git repository/);
  });
});

// -----------------------------------------------------------------------------
// river doctor
// -----------------------------------------------------------------------------

describe('river doctor', () => {
  test('reports basic setup status', async (t) => {
    const { dir, cleanup } = await createRepoWithSilentCatchChange();
    t.after(cleanup);

    const result = await runCliInProcess(['doctor', '.', '--debug'], { cwd: dir });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.match(result.stdout, /River Reviewer doctor/);
    assert.match(result.stdout, /Skills loaded:/);
    assert.match(result.stdout, /Merge base:/);
    assert.match(result.stdout, /--- diff preview ---/);
  });

  test('fails gracefully outside git repos', async (t) => {
    const dir = createTempDir({ prefix: 'river-cli-empty-' });
    t.after(() => cleanupTempDirAsync(dir));
    mkdirSync(resolve(dir, 'nested'));

    const result = await runCliInProcess(['doctor', '.'], { cwd: dir });
    assert.notStrictEqual(result.code, 0);
    assert.match(result.stderr, /Not a git repository/);
  });
});

// -----------------------------------------------------------------------------
// river skills subcommands
// -----------------------------------------------------------------------------

describe('river skills subcommands', () => {
  test('import --loose --dry-run exits 0 with summary', async () => {
    const fixturesDir = resolve('tests', 'fixtures', 'agent-skills');
    const result = await runCliInProcess(
      ['skills', 'import', '--from', fixturesDir, '--loose', '--dry-run'],
      { cwd: process.cwd() }
    );
    assert.strictEqual(result.code, 0, `stderr: ${result.stderr}`);
    assert.match(result.stdout, /Import complete/);
  });

  test('list --source rr exits 0 and shows table', async () => {
    const result = await runCliInProcess(['skills', 'list', '--source', 'rr'], {
      cwd: process.cwd(),
    });
    assert.strictEqual(result.code, 0, `stderr: ${result.stderr}`);
    assert.match(result.stdout, /ID/);
    assert.match(result.stdout, /Total:/);
  });

  test('import with empty dir emits warning and exits 0', async (t) => {
    const emptyDir = createTempDir({ prefix: 'river-cli-empty-skills-' });
    t.after(() => cleanupTempDirAsync(emptyDir));

    const result = await runCliInProcess(['skills', 'import', '--from', emptyDir, '--dry-run'], {
      cwd: process.cwd(),
    });
    assert.strictEqual(result.code, 0, `stderr: ${result.stderr}`);
    assert.match(result.stdout + result.stderr, /No Agent Skills/);
  });
});

// Keep a reference to runCliAsSubprocess so lint / unused-import warnings don't
// fire — it remains exported from helpers for future tests that need true
// process isolation, even though this file migrated to in-process.
void runCliAsSubprocess;
// writeFile is re-exported for potential use in follow-up tests.
void writeFile;
