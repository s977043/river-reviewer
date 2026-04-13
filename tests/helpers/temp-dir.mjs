// tests/helpers/temp-dir.mjs
//
// 一時ディレクトリの生成・後片付けを集約するヘルパー。
// 既存テストで mkdtempSync + finally { rm } パターンが 10+ ファイルに散在していたのを
// 単一の API に集約する。
//
// 使い分け:
//   - withTempDir(async (dir) => {...}) : callback スコープ。自動 cleanup。
//   - createTempDir({ prefix }) : 手動 cleanup。t.after(() => cleanupTempDir(dir)) と併用。
//
// See also: tests/helpers/README.md

import { mkdtempSync, rmSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const DEFAULT_PREFIX = 'river-test-';

/**
 * 同期版の一時ディレクトリ生成。cleanup は呼び出し側の責務。
 * @param {{ prefix?: string }} [options]
 * @returns {string} 生成された絶対パス
 */
export function createTempDir(options = {}) {
  const { prefix = DEFAULT_PREFIX } = options;
  return mkdtempSync(join(tmpdir(), prefix));
}

/**
 * 非同期版の一時ディレクトリ生成。cleanup は呼び出し側の責務。
 * @param {{ prefix?: string }} [options]
 * @returns {Promise<string>}
 */
export async function createTempDirAsync(options = {}) {
  const { prefix = DEFAULT_PREFIX } = options;
  return mkdtemp(join(tmpdir(), prefix));
}

/**
 * 一時ディレクトリを削除する（存在しなくてもエラーにしない）。
 * @param {string} dir
 */
export function cleanupTempDir(dir) {
  if (!dir) return;
  rmSync(dir, { recursive: true, force: true });
}

/**
 * 非同期版の cleanup。
 * @param {string} dir
 */
export async function cleanupTempDirAsync(dir) {
  if (!dir) return;
  await rm(dir, { recursive: true, force: true });
}

/**
 * callback スコープで一時ディレクトリを提供し、終了時に自動で削除する。
 * callback が throw しても cleanup は実行される。
 *
 * @template T
 * @param {(dir: string) => T | Promise<T>} fn
 * @param {{ prefix?: string }} [options]
 * @returns {Promise<T>}
 */
export async function withTempDir(fn, options = {}) {
  const dir = await createTempDirAsync(options);
  try {
    return await fn(dir);
  } finally {
    await cleanupTempDirAsync(dir);
  }
}
