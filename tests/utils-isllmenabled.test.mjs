// tests/utils-isllmenabled.test.mjs
//
// isLlmEnabled() の offline (rules-only) 挙動を検証する (#1071 / ADR-002)。
// RIVER_OFFLINE が立っているときは API キーがあっても false を返す。

import assert from 'node:assert/strict';
import test from 'node:test';

import { isLlmEnabled } from '../src/lib/utils.mjs';

const KEYS = [
  'RIVER_OPENAI_API_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_API_KEY',
  'ANTHROPIC_API_KEY',
  'RIVER_ANTHROPIC_API_KEY',
];

function withEnv(overrides, fn) {
  const backup = {};
  const keys = [...KEYS, 'RIVER_OFFLINE'];
  for (const k of keys) {
    backup[k] = process.env[k];
    delete process.env[k];
  }
  Object.assign(process.env, overrides);
  try {
    return fn();
  } finally {
    for (const k of keys) {
      if (backup[k] === undefined) delete process.env[k];
      else process.env[k] = backup[k];
    }
  }
}

test('isLlmEnabled: true when a key is set and not offline', () => {
  withEnv({ OPENAI_API_KEY: 'sk-test' }, () => {
    assert.equal(isLlmEnabled(), true);
  });
});

test('isLlmEnabled: false when no key is set', () => {
  withEnv({}, () => {
    assert.equal(isLlmEnabled(), false);
  });
});

test('isLlmEnabled: RIVER_OFFLINE=1 forces false even with a key (#1071)', () => {
  withEnv({ OPENAI_API_KEY: 'sk-test', RIVER_OFFLINE: '1' }, () => {
    assert.equal(isLlmEnabled(), false);
  });
});

test('isLlmEnabled: RIVER_OFFLINE=true also forces false', () => {
  withEnv({ ANTHROPIC_API_KEY: 'sk-ant', RIVER_OFFLINE: 'true' }, () => {
    assert.equal(isLlmEnabled(), false);
  });
});

test('isLlmEnabled: RIVER_OFFLINE is case-insensitive and trims (#1094 review)', () => {
  for (const v of ['TRUE', ' True ', 'YES', 'on']) {
    withEnv({ OPENAI_API_KEY: 'sk-test', RIVER_OFFLINE: v }, () => {
      assert.equal(isLlmEnabled(), false, `RIVER_OFFLINE=${JSON.stringify(v)} should disable`);
    });
  }
});

test('isLlmEnabled: RIVER_OFFLINE=0 / empty does not disable', () => {
  for (const v of ['0', '', 'false']) {
    withEnv({ OPENAI_API_KEY: 'sk-test', RIVER_OFFLINE: v }, () => {
      assert.equal(isLlmEnabled(), true, `RIVER_OFFLINE=${JSON.stringify(v)} should not disable`);
    });
  }
});
