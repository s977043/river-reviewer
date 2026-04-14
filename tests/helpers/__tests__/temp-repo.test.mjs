import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  createTempGitRepo,
  createRepoWithSilentCatchChange,
  runGit,
} from '../temp-repo.mjs';

test('createTempGitRepo creates an initialized git repo with default branch', async (t) => {
  const { dir, cleanup } = await createTempGitRepo();
  t.after(cleanup);
  assert.ok(existsSync(join(dir, '.git')));
  const { stdout } = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], dir);
  assert.equal(stdout.trim(), 'main');
});

test('createTempGitRepo commits initialFiles and leaves changedFiles unstaged', async (t) => {
  const { dir, cleanup } = await createTempGitRepo({
    initialFiles: { 'src/a.js': 'export const v = 1;\n' },
    changedFiles: { 'src/a.js': 'export const v = 2;\n' },
  });
  t.after(cleanup);

  // committed snapshot is the initial content
  const { stdout: show } = await runGit(['show', 'HEAD:src/a.js'], dir);
  assert.equal(show.trim(), 'export const v = 1;');

  // working tree has the changed content
  const current = readFileSync(join(dir, 'src/a.js'), 'utf8');
  assert.equal(current.trim(), 'export const v = 2;');

  // status shows it as modified
  const { stdout: status } = await runGit(['status', '--porcelain'], dir);
  assert.match(status, /src\/a\.js/);
});

test('createTempGitRepo writes .river/rules.md when rules option provided', async (t) => {
  const { dir, cleanup } = await createTempGitRepo({
    rules: '- Use semantic naming\n',
  });
  t.after(cleanup);
  const rulesPath = join(dir, '.river', 'rules.md');
  assert.ok(existsSync(rulesPath));
  assert.equal(readFileSync(rulesPath, 'utf8'), '- Use semantic naming\n');
});

test('createRepoWithSilentCatchChange includes the silent catch pattern', async (t) => {
  const { dir, cleanup, appPath } = await createRepoWithSilentCatchChange();
  t.after(cleanup);
  assert.equal(appPath, join(dir, 'src', 'app.js'));
  const content = readFileSync(appPath, 'utf8');
  assert.match(content, /catch\(e\)/);
  assert.match(content, /return;/);
});
