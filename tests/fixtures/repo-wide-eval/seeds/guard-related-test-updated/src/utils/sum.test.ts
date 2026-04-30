// Seed test fixture for the #688 eval harness. The body is an
// intentional no-op for node --test discovery; the production project
// would have real assertions here. Both sum.ts and sum.test.ts are
// changed in the diff (test was updated alongside the source), so a
// repo-wide review should NOT flag this as a missing-test case.

import test from 'node:test';

test('seed fixture: guard-related-test-updated (intentional no-op)', () => {
  // No assertions.
});
