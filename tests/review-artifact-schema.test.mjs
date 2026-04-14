import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import test, { describe } from 'node:test';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, '..', 'schemas', 'review-artifact.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

function makeValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

function minimalArtifact(overrides = {}) {
  return {
    version: '1',
    timestamp: '2025-01-01T00:00:00Z',
    phase: 'midstream',
    status: 'ok',
    ...overrides,
  };
}

function validFinding(overrides = {}) {
  return {
    id: 'f-1',
    ruleId: 'rule-1',
    title: 'Title',
    message: 'A detailed message',
    severity: 'major',
    phase: 'midstream',
    file: 'src/foo.mjs',
    ...overrides,
  };
}

describe('review-artifact.schema.json', () => {
  test('accepts a minimal valid artifact', () => {
    const validate = makeValidator();
    const ok = validate(minimalArtifact());
    assert.equal(ok, true, JSON.stringify(validate.errors));
  });

  test('accepts a full artifact with plan, findings, and context', () => {
    const validate = makeValidator();
    const artifact = minimalArtifact({
      plan: {
        selectedSkills: [
          { id: 's1', name: 'skill one', phase: 'midstream', modelHint: 'balanced' },
        ],
        skippedSkills: [{ id: 's2', reasons: ['phase mismatch'] }],
        plannerMode: 'prune',
        plannerReasons: [{ id: 's1', reason: 'high signal' }],
        impactTags: ['security'],
      },
      findings: [validFinding()],
      context: {
        repoRoot: '/repo',
        defaultBranch: 'main',
        mergeBase: 'abc123',
        changedFiles: ['src/foo.mjs'],
        tokenEstimate: 100,
        rawTokenEstimate: 150,
        reduction: 33,
      },
      debug: { any: 'value' },
    });
    const ok = validate(artifact);
    assert.equal(ok, true, JSON.stringify(validate.errors));
  });

  test('rejects version other than "1"', () => {
    const validate = makeValidator();
    const ok = validate(minimalArtifact({ version: '2' }));
    assert.equal(ok, false);
  });

  test('rejects missing required top-level fields', () => {
    const validate = makeValidator();
    const { version, ...rest } = minimalArtifact();
    assert.equal(validate(rest), false);
  });

  test('rejects unknown top-level properties (additionalProperties: false)', () => {
    const validate = makeValidator();
    const ok = validate(minimalArtifact({ extra: true }));
    assert.equal(ok, false);
  });

  test('rejects finding missing required fields (findings.items enforces issue shape)', () => {
    const validate = makeValidator();
    const bad = validFinding();
    delete bad.severity;
    const ok = validate(minimalArtifact({ findings: [bad] }));
    assert.equal(ok, false);
  });

  test('rejects finding with invalid severity enum', () => {
    const validate = makeValidator();
    const ok = validate(minimalArtifact({ findings: [validFinding({ severity: 'blocker' })] }));
    assert.equal(ok, false);
  });

  test('rejects modelHint outside ModelHintEnum', () => {
    const validate = makeValidator();
    const ok = validate(
      minimalArtifact({
        plan: {
          selectedSkills: [{ id: 's1', name: 'n', modelHint: 'fast' }],
        },
      })
    );
    assert.equal(ok, false);
  });

  test('accepts valid modelHint values', () => {
    const validate = makeValidator();
    for (const hint of ['cheap', 'balanced', 'high-accuracy']) {
      const ok = validate(
        minimalArtifact({
          plan: { selectedSkills: [{ id: 's1', name: 'n', modelHint: hint }] },
        })
      );
      assert.equal(ok, true, `${hint} should be valid: ${JSON.stringify(validate.errors)}`);
    }
  });

  test('rejects plannerReasons item missing id or reason', () => {
    const validate = makeValidator();
    const ok = validate(minimalArtifact({ plan: { plannerReasons: [{ id: 's1' }] } }));
    assert.equal(ok, false);
  });

  test('rejects reduction outside 0..100', () => {
    const validate = makeValidator();
    assert.equal(validate(minimalArtifact({ context: { reduction: -1 } })), false);
    assert.equal(validate(minimalArtifact({ context: { reduction: 101 } })), false);
  });

  test('rejects negative rawTokenEstimate / tokenEstimate', () => {
    const validate = makeValidator();
    assert.equal(validate(minimalArtifact({ context: { rawTokenEstimate: -1 } })), false);
    assert.equal(validate(minimalArtifact({ context: { tokenEstimate: -1 } })), false);
  });

  test('accepts context with rawTokenEstimate (emitted by local-runner)', () => {
    const validate = makeValidator();
    const ok = validate(
      minimalArtifact({
        context: { tokenEstimate: 80, rawTokenEstimate: 120, reduction: 33 },
      })
    );
    assert.equal(ok, true, JSON.stringify(validate.errors));
  });
});
