import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import test, { describe } from 'node:test';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import { runReviewPlan, ReviewPlanError } from '../src/lib/review-plan.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'schemas', 'review-artifact.schema.json'), 'utf8')
);

function makeValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

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
  test('emits a schema-valid Review Artifact (version "1")', async () => {
    const validate = makeValidator();
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
    assert.equal(artifact.status, 'ok');
    assert.deepEqual(artifact.findings, []);
    assert.equal(artifact.plan.plannerMode, 'off');
    assert.deepEqual(artifact.plan.selectedSkills, []);
    assert.equal('debug' in artifact, false);
  });

  test('attaches resolved artifacts under debug only when debug is set (still schema-valid)', async () => {
    const validate = makeValidator();
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
