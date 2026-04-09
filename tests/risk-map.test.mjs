import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { loadRiskMap, evaluateRisk, aggregateRiskLevel } from '../src/lib/risk-map.mjs';

function createTempDir() {
  return mkdtempSync(path.join(tmpdir(), 'river-risk-map-'));
}

async function writeRiskMap(dir, content) {
  const riverDir = path.join(dir, '.river');
  await mkdir(riverDir, { recursive: true });
  writeFileSync(path.join(riverDir, 'risk-map.yaml'), content);
}

// --- loadRiskMap ---

test('loadRiskMap returns null when file is absent', async () => {
  const dir = createTempDir();
  try {
    const result = await loadRiskMap(dir);
    assert.equal(result, null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('loadRiskMap returns null when file is empty', async () => {
  const dir = createTempDir();
  try {
    await writeRiskMap(dir, '   \n  ');
    const result = await loadRiskMap(dir);
    assert.equal(result, null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('loadRiskMap parses valid YAML', async () => {
  const dir = createTempDir();
  try {
    await writeRiskMap(
      dir,
      `
rules:
  - pattern: "src/auth/**"
    action: require_human_review
    reason: "Security critical"
  - pattern: "docs/**"
    action: comment_only
defaults:
  action: escalate
`,
    );
    const result = await loadRiskMap(dir);
    assert.equal(result.rules.length, 2);
    assert.equal(result.rules[0].action, 'require_human_review');
    assert.equal(result.rules[0].reason, 'Security critical');
    assert.equal(result.defaults.action, 'escalate');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('loadRiskMap applies defaults when defaults section is absent', async () => {
  const dir = createTempDir();
  try {
    await writeRiskMap(
      dir,
      `
rules:
  - pattern: "**/*.sql"
    action: escalate
`,
    );
    const result = await loadRiskMap(dir);
    assert.equal(result.defaults.action, 'comment_only');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('loadRiskMap rejects invalid action value', async () => {
  const dir = createTempDir();
  try {
    await writeRiskMap(
      dir,
      `
rules:
  - pattern: "**/*"
    action: auto_merge
`,
    );
    await assert.rejects(() => loadRiskMap(dir), { name: 'RiskMapError' });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('loadRiskMap rejects empty rules array', async () => {
  const dir = createTempDir();
  try {
    await writeRiskMap(dir, 'rules: []');
    await assert.rejects(() => loadRiskMap(dir), { name: 'RiskMapError' });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('loadRiskMap rejects path outside repository', async () => {
  const dir = createTempDir();
  try {
    await assert.rejects(() => loadRiskMap(dir, { riskMapPath: '../../etc/passwd' }), {
      name: 'RiskMapError',
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});


test('loadRiskMap rejects malformed YAML', async () => {
  const dir = createTempDir();
  try {
    await writeRiskMap(dir, '{ bad yaml ::: }');
    await assert.rejects(() => loadRiskMap(dir), { name: 'RiskMapError' });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// --- evaluateRisk ---

test('evaluateRisk: first matching rule wins', () => {
  const riskMap = {
    rules: [
      { pattern: 'src/auth/**', action: 'require_human_review', reason: 'Auth' },
      { pattern: 'src/**', action: 'comment_only' },
    ],
    defaults: { action: 'comment_only' },
  };
  const result = evaluateRisk(riskMap, ['src/auth/handler.ts', 'src/utils.ts']);
  assert.equal(result.fileRisks[0].action, 'require_human_review');
  assert.equal(result.fileRisks[0].rule.reason, 'Auth');
  assert.equal(result.fileRisks[1].action, 'comment_only');
});

test('evaluateRisk: falls back to defaults when no rules match', () => {
  const riskMap = {
    rules: [{ pattern: 'src/auth/**', action: 'require_human_review' }],
    defaults: { action: 'escalate' },
  };
  const result = evaluateRisk(riskMap, ['docs/readme.md']);
  assert.equal(result.fileRisks[0].action, 'escalate');
  assert.equal(result.fileRisks[0].rule, undefined);
});

test('evaluateRisk: aggregates to highest risk level', () => {
  const riskMap = {
    rules: [
      { pattern: 'db/migrations/**', action: 'require_human_review' },
      { pattern: 'src/**', action: 'escalate' },
      { pattern: 'docs/**', action: 'comment_only' },
    ],
    defaults: { action: 'comment_only' },
  };
  const result = evaluateRisk(riskMap, [
    'docs/readme.md',
    'src/app.ts',
    'db/migrations/001.sql',
  ]);
  assert.equal(result.aggregateAction, 'require_human_review');
  assert.deepEqual(result.escalatedFiles, ['src/app.ts']);
  assert.deepEqual(result.humanReviewFiles, ['db/migrations/001.sql']);
});

test('evaluateRisk: handles empty file list', () => {
  const riskMap = {
    rules: [{ pattern: '**/*', action: 'escalate' }],
    defaults: { action: 'comment_only' },
  };
  const result = evaluateRisk(riskMap, []);
  assert.deepEqual(result.fileRisks, []);
  assert.equal(result.aggregateAction, 'comment_only');
});

test('evaluateRisk: returns default action when riskMap is null', () => {
  const result = evaluateRisk(null, ['src/app.ts']);
  assert.equal(result.aggregateAction, 'comment_only');
  assert.deepEqual(result.fileRisks, []);
});

test('evaluateRisk: glob patterns match dot files', () => {
  const riskMap = {
    rules: [{ pattern: '.github/workflows/**', action: 'escalate', reason: 'CI config' }],
    defaults: { action: 'comment_only' },
  };
  const result = evaluateRisk(riskMap, ['.github/workflows/deploy.yml']);
  assert.equal(result.fileRisks[0].action, 'escalate');
  assert.equal(result.escalatedFiles.length, 1);
});

// --- aggregateRiskLevel ---

test('aggregateRiskLevel: returns fallback for empty array', () => {
  assert.equal(aggregateRiskLevel([], 'escalate'), 'escalate');
  assert.equal(aggregateRiskLevel(null), 'comment_only');
});

test('aggregateRiskLevel: picks highest priority', () => {
  const risks = [
    { action: 'comment_only' },
    { action: 'escalate' },
    { action: 'comment_only' },
  ];
  assert.equal(aggregateRiskLevel(risks), 'escalate');
});
