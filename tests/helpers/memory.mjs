// tests/helpers/memory.mjs
//
// Riverbed Memory 関連テストの重複ヘルパーを集約する。
//   - riverbed-memory.test.mjs:  フラット配置（dir/index.json）
//   - suppression.test.mjs:      nested 配置（dir/.river/memory/index.json）
//   - memory-context.test.mjs:   nested 配置 + writeIndex ヘルパー
//
// createTempMemory() は両方の layout を { layout: 'flat' | 'nested' } で切替可能にする。

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createTempDir, cleanupTempDir } from './temp-dir.mjs';

/**
 * Riverbed Memory 用の一時ディレクトリを生成する。
 *
 * @param {{
 *   layout?: 'flat' | 'nested',   // flat: dir/index.json / nested: dir/.river/memory/index.json
 *   entries?: Array<object>,      // 初期 entries
 *   prefix?: string,
 * }} [options]
 * @returns {{
 *   dir: string,
 *   indexPath: string,
 *   cleanup: () => void,
 * }}
 */
export function createTempMemory(options = {}) {
  const {
    layout = 'nested',
    entries = null,
    prefix = 'river-mem-',
  } = options;

  const dir = createTempDir({ prefix });
  let indexPath;
  if (layout === 'nested') {
    const memDir = join(dir, '.river', 'memory');
    mkdirSync(memDir, { recursive: true });
    indexPath = join(memDir, 'index.json');
  } else {
    indexPath = join(dir, 'index.json');
  }

  if (entries) {
    writeFileSync(
      indexPath,
      JSON.stringify({ entries, version: '1' }, null, 2),
      'utf8',
    );
  }

  const cleanup = () => cleanupTempDir(dir);
  return { dir, indexPath, cleanup };
}

let entryCounter = 0;

/**
 * Riverbed Memory テスト用の entry を生成する。
 * id はグローバルカウンタ + タイムスタンプで一意性を担保する（Math.random() 非利用）。
 *
 * @param {object} [overrides]
 * @returns {object}
 */
export function makeMemoryEntry(overrides = {}) {
  entryCounter += 1;
  const defaults = {
    id: `test-entry-${Date.now()}-${entryCounter}`,
    type: 'review',
    content: 'Test content',
    metadata: {
      createdAt: new Date().toISOString(),
      author: 'test',
    },
  };
  // metadata をマージ（overrides.metadata があれば上書き）
  return {
    ...defaults,
    ...overrides,
    metadata: {
      ...defaults.metadata,
      ...(overrides.metadata || {}),
    },
  };
}

/**
 * 指定した index.json に entries 配列をそのまま書き込む。
 * @param {string} indexPath
 * @param {Array<object>} entries
 */
export function writeMemoryIndex(indexPath, entries) {
  writeFileSync(
    indexPath,
    JSON.stringify({ entries, version: '1' }, null, 2),
    'utf8',
  );
}
