import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { compileReviewArtifactValidator } from './helpers/schema-validator.mjs';

const validate = compileReviewArtifactValidator();

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
    const ok = validate(minimalArtifact());
    assert.equal(ok, true, JSON.stringify(validate.errors));
  });

  test('accepts a full artifact with plan, findings, and context', () => {
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
    const ok = validate(minimalArtifact({ version: '2' }));
    assert.equal(ok, false);
  });

  test('rejects missing required top-level fields', () => {
    const { version, ...rest } = minimalArtifact();
    assert.equal(validate(rest), false);
  });

  test('rejects unknown top-level properties (additionalProperties: false)', () => {
    const ok = validate(minimalArtifact({ extra: true }));
    assert.equal(ok, false);
  });

  test('rejects finding missing required fields (findings.items enforces issue shape)', () => {
    const bad = validFinding();
    delete bad.severity;
    const ok = validate(minimalArtifact({ findings: [bad] }));
    assert.equal(ok, false);
  });

  test('rejects finding with invalid severity enum', () => {
    const ok = validate(minimalArtifact({ findings: [validFinding({ severity: 'blocker' })] }));
    assert.equal(ok, false);
  });

  test('rejects modelHint outside ModelHintEnum', () => {
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
    const ok = validate(minimalArtifact({ plan: { plannerReasons: [{ id: 's1' }] } }));
    assert.equal(ok, false);
  });

  test('rejects reduction outside 0..100', () => {
    assert.equal(validate(minimalArtifact({ context: { reduction: -1 } })), false);
    assert.equal(validate(minimalArtifact({ context: { reduction: 101 } })), false);
  });

  test('rejects negative rawTokenEstimate / tokenEstimate', () => {
    assert.equal(validate(minimalArtifact({ context: { rawTokenEstimate: -1 } })), false);
    assert.equal(validate(minimalArtifact({ context: { tokenEstimate: -1 } })), false);
  });

  test('accepts context with rawTokenEstimate (emitted by local-runner)', () => {
    const ok = validate(
      minimalArtifact({
        context: { tokenEstimate: 80, rawTokenEstimate: 120, reduction: 33 },
      })
    );
    assert.equal(ok, true, JSON.stringify(validate.errors));
  });
});
