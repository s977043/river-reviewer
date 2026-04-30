// Seed fixture for the #688 eval harness. See payment.test.ts in the
// api-contract-no-test-01 seed for the rationale; collectRepoContext
// checks file presence, node --test must not fail on this file.

import test from 'node:test';

test('seed fixture: i18n-unused-key-01 (intentional no-op)', () => {
  // No assertions. Real projects would have UserProfile rendering
  // assertions here.
});
