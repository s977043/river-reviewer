import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { formatReviewPlanSummaryMarkdown } from '../src/lib/review-plan-summary.mjs';

describe('formatReviewPlanSummaryMarkdown (#802 Phase 3)', () => {
  test('renders status, phase, planner mode and skill lists', () => {
    const md = formatReviewPlanSummaryMarkdown({
      status: 'ok',
      phase: 'upstream',
      plan: {
        plannerMode: 'off',
        selectedSkills: [{ id: 's1', name: 'Skill One' }],
        skippedSkills: [{ id: 's2', reasons: ['phase mismatch', 'no match'] }],
      },
    });
    assert.match(md, /^# river review plan/m);
    assert.match(md, /Status: `ok`/);
    assert.match(md, /Phase: `upstream`/);
    assert.match(md, /Planner mode: `off`/);
    assert.match(md, /## Selected skills \(1\)/);
    assert.match(md, /`s1` — Skill One/);
    assert.match(md, /## Skipped skills \(1\)/);
    assert.match(md, /`s2`: phase mismatch; no match/);
  });

  test('handles empty / missing plan fields without throwing', () => {
    const md = formatReviewPlanSummaryMarkdown({ status: 'no-changes', phase: 'midstream' });
    assert.match(md, /Status: `no-changes`/);
    assert.match(md, /## Selected skills \(0\)/);
    assert.match(md, /_None\._/);
  });
});
