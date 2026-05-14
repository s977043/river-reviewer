import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  computePerSkillFpRate,
  getPerSkillFpRate,
} from '../src/lib/eval-snapshots.mjs';

// computePerSkillFpRate is the pure accumulator extracted in Issue #793.
// It must return identical output whether called directly (fast path) or
// via getPerSkillFpRate(result, cases). The legacy zero-arg form
// (getPerSkillFpRate()) is exercised elsewhere via the snapshot integration.

describe('computePerSkillFpRate', () => {
  test('returns empty object when result has no cases', () => {
    assert.deepEqual(computePerSkillFpRate({ cases: [] }, []), {});
    assert.deepEqual(computePerSkillFpRate({}, []), {});
  });

  test('attributes guard cases to their planSkills by array index', () => {
    const result = {
      cases: [
        { isGuardCase: true, guardViolated: false },
        { isGuardCase: true, guardViolated: true },
        { isGuardCase: false }, // non-guard cases skipped
      ],
    };
    const cases = [
      { planSkills: ['skill-a', 'skill-b'] },
      { planSkills: ['skill-b'] },
      { planSkills: ['skill-c'] },
    ];
    const out = computePerSkillFpRate(result, cases);
    assert.deepEqual(out, {
      'skill-a': { guards: 1, fps: 0, fpRate: 0 },
      'skill-b': { guards: 2, fps: 1, fpRate: 0.5 },
    });
    // skill-c was on a non-guard case → must not appear.
    assert.equal(out['skill-c'], undefined);
  });

  test('handles cases with empty / missing planSkills', () => {
    const result = {
      cases: [
        { isGuardCase: true, guardViolated: true },
        { isGuardCase: true, guardViolated: false },
      ],
    };
    const cases = [{}, { planSkills: [] }];
    assert.deepEqual(computePerSkillFpRate(result, cases), {});
  });

  test('rounds fpRate correctly when guards > 0', () => {
    const result = {
      cases: [
        { isGuardCase: true, guardViolated: true },
        { isGuardCase: true, guardViolated: true },
        { isGuardCase: true, guardViolated: false },
        { isGuardCase: true, guardViolated: false },
      ],
    };
    const cases = [
      { planSkills: ['x'] },
      { planSkills: ['x'] },
      { planSkills: ['x'] },
      { planSkills: ['x'] },
    ];
    const out = computePerSkillFpRate(result, cases);
    assert.equal(out['x'].guards, 4);
    assert.equal(out['x'].fps, 2);
    assert.equal(out['x'].fpRate, 0.5);
  });
});

describe('getPerSkillFpRate (fast path = pre-computed args)', () => {
  test('takes the fast path when result + cases are provided and never re-runs the eval', async () => {
    // If the function ever called evaluateReviewFixtures, this test would
    // need a fixtures directory and would take real time. By passing data
    // directly, we both verify the fast-path behavior and prove the
    // duplicate-eval path is gone for callers that thread the result.
    const result = {
      cases: [
        { isGuardCase: true, guardViolated: false },
        { isGuardCase: true, guardViolated: true },
      ],
    };
    const cases = [{ planSkills: ['a'] }, { planSkills: ['a'] }];
    const out = await getPerSkillFpRate(result, cases);
    assert.deepEqual(out, { a: { guards: 2, fps: 1, fpRate: 0.5 } });
  });

  test('fast path rejects malformed shapes (non-array cases) and falls back', async () => {
    // When cases is not an array, the fast-path guard should refuse it and
    // hand control to the legacy disk path. We can't assert the disk path's
    // exact return here (depends on test env), but we can assert it does not
    // crash and yields an object.
    const out = await getPerSkillFpRate({ cases: [] }, 'not-an-array');
    assert.equal(typeof out, 'object');
    assert.ok(out !== null);
  });
});
