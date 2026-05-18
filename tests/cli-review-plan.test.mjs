import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test, { describe } from 'node:test';

import {
  runReviewPlan,
  ReviewPlanError,
  resolveReviewOutputFormat,
} from '../src/lib/review-plan.mjs';
import { compileReviewArtifactValidator } from './helpers/schema-validator.mjs';

const validate = compileReviewArtifactValidator();

describe('resolveReviewOutputFormat (#802 Phase 3 PR-2)', () => {
  test('no flags → json (backward compatible)', () => {
    assert.equal(resolveReviewOutputFormat({}), 'json');
    assert.equal(resolveReviewOutputFormat({ output: 'text' }), 'json'); // default, not explicit
  });

  test('explicit --output json / --format json → json', () => {
    assert.equal(resolveReviewOutputFormat({ output: 'json', outputExplicit: true }), 'json');
    assert.equal(resolveReviewOutputFormat({ format: 'json', formatExplicit: true }), 'json');
  });

  test('matching --output and --format → json', () => {
    assert.equal(
      resolveReviewOutputFormat({
        output: 'json',
        outputExplicit: true,
        format: 'json',
        formatExplicit: true,
      }),
      'json'
    );
  });

  test('conflicting --output and --format → ReviewPlanError', () => {
    assert.throws(
      () =>
        resolveReviewOutputFormat({
          output: 'json',
          outputExplicit: true,
          format: 'markdown',
          formatExplicit: true,
        }),
      (e) => e instanceof ReviewPlanError && /conflicts/.test(e.message)
    );
  });

  test('explicit text/markdown → ReviewPlanError (not implemented)', () => {
    assert.throws(
      () => resolveReviewOutputFormat({ output: 'text', outputExplicit: true }),
      (e) => e instanceof ReviewPlanError && /not implemented/.test(e.message)
    );
    assert.throws(
      () => resolveReviewOutputFormat({ format: 'markdown', formatExplicit: true }),
      ReviewPlanError
    );
  });

  test('explicit --output yaml → ReviewPlanError (review disallows yaml)', () => {
    assert.throws(
      () => resolveReviewOutputFormat({ output: 'yaml', outputExplicit: true }),
      (e) => e instanceof ReviewPlanError && /Unsupported output format/.test(e.message)
    );
  });
});

const fixedNow = () => '2026-05-17T00:00:00Z';
const okConfig = async () => ({});

describe('runReviewPlan — guards (#802 Phase 3)', () => {
  test('throws ReviewPlanError when --plan-only is not set', async () => {
    await assert.rejects(
      () => runReviewPlan({ planOnly: false, loadConfigImpl: okConfig }),
      ReviewPlanError
    );
  });

  test('throws ReviewPlanError on invalid phase', async () => {
    await assert.rejects(
      () =>
        runReviewPlan({
          planOnly: true,
          phase: 'bogus',
          loadConfigImpl: okConfig,
          resolveAllArtifactsImpl: async () => ({}),
        }),
      ReviewPlanError
    );
  });

  test('wraps config load failure as ReviewPlanError', async () => {
    await assert.rejects(
      () =>
        runReviewPlan({
          planOnly: true,
          loadConfigImpl: async () => {
            throw new Error('bad yaml');
          },
        }),
      (err) => err instanceof ReviewPlanError && /bad yaml/.test(err.message)
    );
  });
});

describe('runReviewPlan — output (#802 Phase 3)', () => {
  test('no diff artifact → schema-valid no-changes artifact (version "1")', async () => {
    const artifact = await runReviewPlan({
      planOnly: true,
      phase: 'upstream',
      now: fixedNow,
      loadConfigImpl: okConfig,
      resolveAllArtifactsImpl: async () => ({}),
    });
    assert.equal(validate(artifact), true, JSON.stringify(validate.errors));
    assert.equal(artifact.version, '1');
    assert.equal(artifact.phase, 'upstream');
    assert.equal(artifact.status, 'no-changes');
    assert.deepEqual(artifact.findings, []);
    assert.equal(artifact.plan.plannerMode, 'off');
    assert.deepEqual(artifact.plan.selectedSkills, []);
    assert.equal('debug' in artifact, false);
  });

  test('resolved diff artifact → deterministic skill selection (status ok), no LLM', async () => {
    let planArgs;
    const artifact = await runReviewPlan({
      planOnly: true,
      phase: 'midstream',
      now: fixedNow,
      loadConfigImpl: okConfig,
      resolveAllArtifactsImpl: async () => ({
        diff: { id: 'diff', path: '/repo/d.patch', source: 'cwd', exists: true, optional: true },
      }),
      readFileImpl: async () => '+++ b/src/foo.mjs\n@@ -0,0 +1 @@\n+x\n',
      buildExecutionPlanImpl: async (args) => {
        planArgs = args;
        return {
          selected: [
            {
              metadata: { id: 's1', name: 'Skill One', phase: 'midstream', modelHint: 'balanced' },
            },
          ],
          skipped: [
            { skill: { metadata: { id: 's2', name: 'Skill Two' } }, reasons: ['phase mismatch'] },
          ],
        };
      },
    });
    assert.equal(validate(artifact), true, JSON.stringify(validate.errors));
    assert.equal(artifact.status, 'ok');
    assert.deepEqual(artifact.plan.selectedSkills, [
      { id: 's1', name: 'Skill One', phase: 'midstream', modelHint: 'balanced' },
    ]);
    assert.deepEqual(artifact.plan.skippedSkills, [{ id: 's2', reasons: ['phase mismatch'] }]);
    assert.equal(artifact.plan.plannerMode, 'off');
    // Hard guarantee: no LLM path (planner undefined, dryRun, llm disabled).
    assert.equal(planArgs.planner, undefined);
    assert.equal(planArgs.dryRun, true);
    assert.equal(planArgs.llmEnabled, false);
    assert.equal(planArgs.plannerMode, 'off');
    assert.deepEqual(planArgs.changedFiles, ['src/foo.mjs']);
  });

  test('wraps buildExecutionPlan failure as ReviewPlanError', async () => {
    await assert.rejects(
      () =>
        runReviewPlan({
          planOnly: true,
          loadConfigImpl: okConfig,
          resolveAllArtifactsImpl: async () => ({
            diff: {
              id: 'diff',
              path: '/repo/d.patch',
              source: 'cwd',
              exists: true,
              optional: true,
            },
          }),
          readFileImpl: async () => 'diff --git a/x b/x\n',
          buildExecutionPlanImpl: async () => {
            throw new Error('skill load boom');
          },
        }),
      (err) => err instanceof ReviewPlanError && /skill load boom/.test(err.message)
    );
  });

  test('attaches resolved artifacts under debug only when debug is set (still schema-valid)', async () => {
    const resolved = {
      plan: { id: 'plan', path: '/repo/plan.md', source: 'cli', exists: true, optional: false },
    };
    const artifact = await runReviewPlan({
      planOnly: true,
      debug: true,
      now: fixedNow,
      loadConfigImpl: okConfig,
      resolveAllArtifactsImpl: async () => resolved,
    });
    assert.equal(validate(artifact), true, JSON.stringify(validate.errors));
    assert.deepEqual(artifact.debug.resolvedArtifacts, resolved);
  });

  test('passes cli artifacts and config artifacts through to the resolver', async () => {
    let received;
    await runReviewPlan({
      planOnly: true,
      cwd: '/repo',
      cliArtifacts: { plan: './plan.md' },
      artifactsDir: 'sub',
      now: fixedNow,
      loadConfigImpl: async () => ({ artifacts: { diff: './d.patch' } }),
      resolveAllArtifactsImpl: async (opts) => {
        received = opts;
        return {};
      },
    });
    assert.deepEqual(received.cliArgs, { plan: './plan.md' });
    assert.deepEqual(received.configArtifacts, { diff: './d.patch' });
    assert.equal(received.cwd, resolve('/repo', 'sub'));
  });

  test('ignores a non-object config.artifacts', async () => {
    let received;
    await runReviewPlan({
      planOnly: true,
      now: fixedNow,
      loadConfigImpl: async () => ({ artifacts: 'not-an-object' }),
      resolveAllArtifactsImpl: async (opts) => {
        received = opts;
        return {};
      },
    });
    assert.deepEqual(received.configArtifacts, {});
  });
});
