// tests/helpers/temp-repo.mjs
//
// git リポジトリ付き一時ディレクトリの生成ヘルパー。
// cli.test.mjs / integration/local-review.test.mjs で
// createRepoWithChange / setupRepoWithDiff が独自実装されていたのを統合する。
//
// 典型的な利用例:
//   const { dir, cleanup } = await createTempGitRepo({ files: {...}, rules: '...' });
//   t.after(cleanup);

import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

import { createTempDir, cleanupTempDirAsync } from './temp-dir.mjs';

const execFileAsync = promisify(execFile);

/**
 * 指定ディレクトリで git コマンドを実行する。
 * @param {string[]} args
 * @param {string} cwd
 */
export async function runGit(args, cwd) {
  return execFileAsync('git', args, { cwd });
}

/**
 * 指定ディレクトリの相対パスにファイルを書き込む（必要に応じて親を作成）。
 * @param {string} rootDir
 * @param {string} relPath
 * @param {string} content
 */
export function writeFileRelative(rootDir, relPath, content) {
  const abs = join(rootDir, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

/**
 * git 初期化済みの一時リポジトリを生成する。
 *
 * オプション:
 * - initialFiles: 初期コミット時点で存在させたいファイル群（{ relPath: content }）
 * - changedFiles: 初期コミット後に適用する（unstaged な）変更群
 * - rules: .river/rules.md に書き込む内容（指定時のみ作成）
 * - commitInitial: 初期 empty commit を使うか（デフォルト false、initialFiles を使う場合 true 強制）
 * - branch: 初期ブランチ名（デフォルト 'main'）
 * - prefix: 一時ディレクトリ名の prefix
 *
 * @param {{
 *   initialFiles?: Record<string,string>,
 *   changedFiles?: Record<string,string>,
 *   rules?: string,
 *   branch?: string,
 *   prefix?: string,
 * }} [options]
 * @returns {Promise<{ dir: string, cleanup: () => Promise<void> }>}
 */
export async function createTempGitRepo(options = {}) {
  const { initialFiles, changedFiles, rules, branch = 'main', prefix = 'river-repo-' } = options;

  const dir = createTempDir({ prefix });
  // セットアップ中に失敗したときは一時ディレクトリをリークさせないよう、
  // 個別のエラーをキャッチして cleanup を実行してから再 throw する。
  try {
    await runGit(['init', '-b', branch], dir);
    await runGit(['config', 'user.email', 'test@example.com'], dir);
    await runGit(['config', 'user.name', 'River Tester'], dir);

    if (initialFiles && Object.keys(initialFiles).length > 0) {
      for (const [relPath, content] of Object.entries(initialFiles)) {
        writeFileRelative(dir, relPath, content);
      }
      await runGit(['add', '.'], dir);
      await runGit(['commit', '-m', 'init'], dir);
    } else {
      await runGit(['commit', '--allow-empty', '-m', 'init'], dir);
    }

    if (changedFiles) {
      for (const [relPath, content] of Object.entries(changedFiles)) {
        writeFileRelative(dir, relPath, content);
      }
    }

    if (typeof rules === 'string') {
      writeFileRelative(dir, '.river/rules.md', rules);
    }
  } catch (error) {
    await cleanupTempDirAsync(dir);
    throw error;
  }

  const cleanup = () => cleanupTempDirAsync(dir);
  return { dir, cleanup };
}

/**
 * cli.test.mjs で使われていた「silent catch を含む変更」を再現するビルダー。
 * 既存テストの細部を壊さないよう、ファイル構造を保つ。
 *
 * @param {{ prefix?: string }} [options]
 * @returns {Promise<{ dir: string, cleanup: () => Promise<void>, appPath: string }>}
 */
export async function createRepoWithSilentCatchChange(options = {}) {
  const { prefix = 'river-cli-' } = options;
  const { dir, cleanup } = await createTempGitRepo({
    prefix,
    initialFiles: { 'src/app.js': 'export const value = 1;\n' },
    changedFiles: {
      'src/app.js': `export const value = 2;
export function test() {
  try {
    run();
  } catch(e) {
    return;
  }
}
`,
    },
  });
  return { dir, cleanup, appPath: join(dir, 'src', 'app.js') };
}
