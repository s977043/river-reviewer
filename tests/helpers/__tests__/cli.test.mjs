import assert from 'node:assert/strict';
import test from 'node:test';

import { runCliAsSubprocess } from '../cli.mjs';

test('runCliAsSubprocess: help flag exits 0 and prints usage', async () => {
  const result = await runCliAsSubprocess(['--help']);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Usage: river/);
});

test('runCliAsSubprocess: unknown command prints help', async () => {
  const result = await runCliAsSubprocess(['no-such-command']);
  // CLI は未知のコマンドでも help を出して 0 で終了する既存挙動
  assert.equal(result.code, 0);
  assert.match(result.stdout, /Usage: river/);
});

test('runCliAsSubprocess: passes through env variables', async () => {
  const result = await runCliAsSubprocess(['--help'], {
    env: { RIVER_TEST_MARKER: 'present' },
  });
  // help は env を使わないが、少なくとも失敗せずに終わること
  assert.equal(result.code, 0);
});

test('runCliInProcess: --help returns 0 and prints usage in-process', async () => {
  const { runCliInProcess } = await import('../cli.mjs');
  const result = await runCliInProcess(['--help']);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Usage: river/);
});

test('runCliInProcess: restores process.env after run', async () => {
  const { runCliInProcess } = await import('../cli.mjs');
  const before = process.env.RIVER_TEST_OVERRIDE;
  await runCliInProcess(['--help'], {
    env: { RIVER_TEST_OVERRIDE: 'yes' },
  });
  assert.equal(process.env.RIVER_TEST_OVERRIDE, before);
});
