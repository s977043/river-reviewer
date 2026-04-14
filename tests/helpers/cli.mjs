// tests/helpers/cli.mjs
//
// CLI 起動用ヘルパー。2 種類の実行方式を提供する:
//
//   - runCliAsSubprocess(argv, { cwd, env })
//     従来の execFile ベース。exit code の厳密な検証や process 終了挙動の確認が必要な場合に使う。
//     起動コストが大きい（~150ms × テスト数）ため、通常テストでは in-process 版を推奨。
//
//   - runCliInProcess(argv, { cwd, env })
//     src/cli.mjs から export された main() を直接呼び出し、stdout/stderr をキャプチャする。
//     環境変数・CWD はスコープ内で差し替え、呼出し後に必ず復元する。
//     Phase 1.2 で src/cli.mjs が parseArgs/main を export するようになってから利用可能。
//
// 返却フォーマットは両者で揃える:
//   { code: number, stdout: string, stderr: string }

import { execFile } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// このヘルパーファイル自身からの相対パスで src/cli.mjs を解決する。
// `resolve('src/cli.mjs')` だと実行時の cwd に依存して壊れるため、
// import.meta.url ベースの絶対パスに固定する。
const DEFAULT_CLI_PATH = fileURLToPath(new URL('../../src/cli.mjs', import.meta.url));

/**
 * 子プロセスとして river CLI を起動する。
 *
 * @param {string[]} argv CLI 引数（例: ['run', '.', '--dry-run']）
 * @param {{ cwd?: string, env?: Record<string,string>, cliPath?: string }} [options]
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
 */
export async function runCliAsSubprocess(argv, options = {}) {
  const { cwd = process.cwd(), env = {}, cliPath = DEFAULT_CLI_PATH } = options;
  try {
    const { stdout, stderr } = await execFileAsync('node', [cliPath, ...argv], {
      cwd,
      env: { ...process.env, ...env },
    });
    return {
      code: 0,
      stdout: stdout.toString(),
      stderr: stderr ? stderr.toString() : '',
    };
  } catch (error) {
    return {
      code: typeof error.code === 'number' ? error.code : 1,
      stdout: error.stdout ? error.stdout.toString() : '',
      stderr: error.stderr ? error.stderr.toString() : '',
    };
  }
}

/**
 * process.env / process.argv / process.cwd をテスト実行中のみ上書きし、終了後に復元する。
 *
 * @template T
 * @param {{
 *   argv?: string[],
 *   env?: Record<string,string>,
 *   cwd?: string,
 *   cliPath?: string,  // process.argv[1] として使用する CLI スクリプトパス
 * }} overrides
 * @param {() => T | Promise<T>} fn
 * @returns {Promise<T>}
 */
async function withProcessOverrides(overrides, fn) {
  const { argv, env, cwd, cliPath = DEFAULT_CLI_PATH } = overrides;

  const envBackup = {};
  if (env) {
    for (const key of Object.keys(env)) {
      envBackup[key] = Object.prototype.hasOwnProperty.call(process.env, key)
        ? process.env[key]
        : undefined;
      if (env[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = env[key];
      }
    }
  }

  const argvBackup = argv ? [...process.argv] : null;
  if (argv) {
    process.argv = [process.argv[0], cliPath, ...argv];
  }

  const cwdBackup = cwd ? process.cwd() : null;
  if (cwd) {
    process.chdir(cwd);
  }

  const exitCodeBackup = process.exitCode;
  process.exitCode = undefined;

  try {
    return await fn();
  } finally {
    if (cwdBackup) {
      try {
        process.chdir(cwdBackup);
      } catch {
        /* ignore */
      }
    }
    if (argvBackup) {
      process.argv = argvBackup;
    }
    if (env) {
      for (const [key, prev] of Object.entries(envBackup)) {
        if (prev === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = prev;
        }
      }
    }
    process.exitCode = exitCodeBackup;
  }
}

/**
 * console.log/error/warn/info を一時的にキャプチャする。
 *
 * 注意: process.stdout.write / process.stderr.write は差し替えない。
 * node:test は内部的に process.stdout.write で TAP 出力を書き込むため、ここを差し替えると
 * 後続のテスト発見・報告が壊れる（子テストが silently drop される）。
 *
 * cli.mjs の出力はほぼ console.log/error のみで、一部の src/lib/agent-skill-bridge.mjs での
 * 直接的な process.stderr.write は本ヘルパーではキャプチャせず、実際の stderr に出る。
 * テストアサーションはこれを前提に組む（skills import の No Agent Skills メッセージは
 * console.error 経由なので問題なし）。
 *
 * @template T
 * @param {() => T | Promise<T>} fn
 * @returns {Promise<{ stdout: string, stderr: string }>}
 */
async function captureConsole(fn) {
  const chunks = { stdout: [], stderr: [] };

  const origLog = console.log;
  const origError = console.error;
  const origWarn = console.warn;
  const origInfo = console.info;

  console.log = (...args) => {
    chunks.stdout.push(args.map(formatConsoleArg).join(' ') + '\n');
  };
  console.info = (...args) => {
    chunks.stdout.push(args.map(formatConsoleArg).join(' ') + '\n');
  };
  console.error = (...args) => {
    chunks.stderr.push(args.map(formatConsoleArg).join(' ') + '\n');
  };
  console.warn = (...args) => {
    chunks.stderr.push(args.map(formatConsoleArg).join(' ') + '\n');
  };

  try {
    await fn();
    return {
      stdout: chunks.stdout.join(''),
      stderr: chunks.stderr.join(''),
    };
  } finally {
    console.log = origLog;
    console.error = origError;
    console.warn = origWarn;
    console.info = origInfo;
  }
}

function formatConsoleArg(arg) {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return arg.stack || arg.message;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

// src/cli.mjs のモジュールキャッシュ。テスト間で使い回すことで高速化する。
// 状態の分離は withProcessOverrides（env/argv/cwd）で実現しており、
// モジュール本体の再ロードは不要（cli.mjs には import.meta.url ガードがあるため
// import しても main() は自動起動しない）。
let cliModuleCache = null;
let cliModuleCachePath = null;

/**
 * in-process で river CLI を実行する。
 * 事前条件: src/cli.mjs が parseArgs / main を export している（Phase 1.2 以降）。
 *
 * @param {string[]} argv CLI 引数
 * @param {{
 *   cwd?: string,
 *   env?: Record<string,string>,
 *   cliPath?: string,
 * }} [options]
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
 */
export async function runCliInProcess(argv, options = {}) {
  const { cwd, env, cliPath = DEFAULT_CLI_PATH } = options;

  if (!cliModuleCache || cliModuleCachePath !== cliPath) {
    // Windows パス対応のため pathToFileURL を経由する
    cliModuleCache = await import(pathToFileURL(cliPath).href);
    cliModuleCachePath = cliPath;
  }
  const mod = cliModuleCache;
  if (typeof mod.main !== 'function') {
    throw new Error(
      'runCliInProcess: src/cli.mjs does not export main(). ' +
        'This helper requires Phase 1.2 (cli.mjs export refactor).'
    );
  }

  let code = 0;
  const captured = await withProcessOverrides({ argv, env, cwd, cliPath }, () =>
    captureConsole(async () => {
      try {
        const result = await mod.main(argv);
        if (typeof result === 'number') {
          code = result;
        } else if (typeof process.exitCode === 'number') {
          code = process.exitCode;
        }
      } catch (error) {
        console.error(`${error.stack || error.message}`);
        code = 1;
      }
    })
  );

  return { code, stdout: captured.stdout, stderr: captured.stderr };
}
