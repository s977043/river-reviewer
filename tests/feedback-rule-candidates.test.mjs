import test from 'node:test';
import assert from 'node:assert/strict';

import { findRuleCandidates } from '../scripts/feedback-rule-candidates.mjs';

const fp = (skillId, pr) => ({ skillId, feedbackType: 'false_positive', pr });

test('groups by (skillId, feedbackType) and applies the threshold', () => {
  const entries = [
    fp('skill-a', 10),
    fp('skill-a', 11),
    fp('skill-b', 12),
    { skillId: 'skill-a', feedbackType: 'missed_issue', pr: 13 },
  ];
  const candidates = findRuleCandidates(entries);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].skillId, 'skill-a');
  assert.equal(candidates[0].feedbackType, 'false_positive');
  assert.deepEqual(candidates[0].prs, [10, 11]);
  assert.match(candidates[0].suggestedAction, /guard fixture/);
});

test('accepted feedback and malformed entries are ignored', () => {
  const entries = [
    { skillId: 'skill-a', feedbackType: 'accepted', pr: 1 },
    { skillId: 'skill-a', feedbackType: 'accepted', pr: 2 },
    { feedbackType: 'false_positive' },
    { skillId: 'skill-b' },
  ];
  assert.deepEqual(findRuleCandidates(entries), []);
});

test('custom threshold and count-descending ordering', () => {
  const entries = [
    fp('skill-a', 1),
    fp('skill-a', 2),
    fp('skill-a', 3),
    { skillId: 'skill-b', feedbackType: 'accepted_risk', pr: 4 },
    { skillId: 'skill-b', feedbackType: 'accepted_risk', pr: 5 },
  ];
  const candidates = findRuleCandidates(entries, { min: 2 });
  assert.deepEqual(
    candidates.map((c) => [c.skillId, c.count]),
    [
      ['skill-a', 3],
      ['skill-b', 2],
    ]
  );
  assert.match(candidates[1].suggestedAction, /rules\.md/);
  assert.equal(findRuleCandidates(entries, { min: 3 }).length, 1);
});
