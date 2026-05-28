// #878 A2-3-runners — buildExecutionPlan output shape.
//
// Verifies the snapshot carry-over field added by this slice. Consumers
// (currently `src/lib/review-plan.mjs`) propagate plan.snapshot to
// artifact.debug.execution.snapshot in a later slice (A2-3-impl).
//
// Also verifies that `riskAssessment` is exposed at the top level — it was
// computed but never returned prior to this PR (silent-skip per #877 taxonomy).

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { buildExecutionPlan } from '../runners/core/review-runner.mjs';

function fakeSkills() {
  return [
    {
      metadata: {
        id: 'fake-midstream-001',
        name: 'Fake midstream',
        description: 'fixture skill',
        phase: 'midstream',
        applyTo: ['src/**/*.ts'],
        inputContext: ['diff'],
        severity: 'minor',
        outputKind: ['findings'],
      },
    },
  ];
}

describe('buildExecutionPlan #878 A2-3-runners — snapshot carry-over', () => {
  test('returns snapshot object with the four documented fields', async () => {
    const plan = await buildExecutionPlan({
      phase: 'midstream',
      changedFiles: ['src/app.ts'],
      availableContexts: ['diff'],
      skills: fakeSkills(),
      diffText: '',
      dryRun: true,
      llmEnabled: false,
    });

    assert.ok(plan.snapshot, 'plan.snapshot should exist');
    for (const key of ['fileTypes', 'relatedADRs', 'reviewMode', 'riskAssessment']) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(plan.snapshot, key),
        `plan.snapshot.${key} should be set`
      );
    }
  });

  test('exposes riskAssessment at the top level (silent-skip fix)', async () => {
    const plan = await buildExecutionPlan({
      phase: 'midstream',
      changedFiles: ['src/app.ts'],
      availableContexts: ['diff'],
      skills: fakeSkills(),
      diffText: '',
      dryRun: true,
      llmEnabled: false,
    });
    assert.ok(
      Object.prototype.hasOwnProperty.call(plan, 'riskAssessment'),
      'plan.riskAssessment must exist (was undefined pre-#878 A2-3-runners)'
    );
  });

  test('riskAssessment reflects evaluateRisk result when riskMap provided', async () => {
    const riskMap = {
      version: '1',
      rules: [{ pattern: 'src/**/*.ts', action: 'require_human_review', reason: 'test' }],
      defaults: { action: 'comment_only' },
    };
    const plan = await buildExecutionPlan({
      phase: 'midstream',
      changedFiles: ['src/app.ts'],
      availableContexts: ['diff'],
      skills: fakeSkills(),
      diffText: '',
      dryRun: true,
      llmEnabled: false,
      riskMap,
    });
    assert.ok(plan.riskAssessment, 'riskAssessment must be set when riskMap matches');
    assert.equal(plan.snapshot.riskAssessment, plan.riskAssessment);
  });

  test('returns null riskAssessment when riskMap is absent (back-compat)', async () => {
    const plan = await buildExecutionPlan({
      phase: 'midstream',
      changedFiles: ['src/app.ts'],
      availableContexts: ['diff'],
      skills: fakeSkills(),
      diffText: '',
      dryRun: true,
      llmEnabled: false,
    });
    assert.equal(plan.riskAssessment, null);
    assert.equal(plan.snapshot.riskAssessment, null);
  });
});
