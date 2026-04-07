import assert from 'node:assert/strict';
import test from 'node:test';

import { detectConfigRisks } from '../src/lib/config-risk.mjs';

test('detectConfigRisks: clean config change is low risk', () => {
  const result = detectConfigRisks([
    {
      file: 'package.json',
      diff: '+    "new-dep": "^1.0.0"',
    },
  ]);
  assert.equal(result.riskLevel, 'low');
});

test('detectConfigRisks: removed env var is warning', () => {
  const result = detectConfigRisks([
    {
      file: '.env.example',
      diff: '-DATABASE_URL=postgres://localhost/dev',
    },
  ]);
  assert.equal(result.riskLevel, 'medium');
  assert.ok(result.risks.some((r) => r.pattern.includes('environment variable')));
});

test('detectConfigRisks: secret in config is critical', () => {
  const result = detectConfigRisks([
    {
      file: 'config.json',
      diff: '+  "api_key": "sk-abc123"',
    },
  ]);
  assert.equal(result.riskLevel, 'high');
});

test('detectConfigRisks: CI permission change is warning', () => {
  const result = detectConfigRisks([
    {
      file: '.github/workflows/deploy.yml',
      diff: '+permissions:\n+  contents: write',
    },
  ]);
  assert.ok(result.risks.some((r) => r.pattern.includes('permissions')));
});

test('detectConfigRisks: empty changes is low risk', () => {
  const result = detectConfigRisks([]);
  assert.equal(result.riskLevel, 'low');
  assert.equal(result.risks.length, 0);
});

test('detectConfigRisks: container privilege escalation is critical', () => {
  const result = detectConfigRisks([
    {
      file: 'docker-compose.yml',
      diff: '+    privileged: true',
    },
  ]);
  assert.equal(result.riskLevel, 'high');
});
