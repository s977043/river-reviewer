// Seed fixture file for the #688 eval harness.
//
// `collectRepoContext` (src/lib/repo-context.mjs) checks whether a test
// file with the conventional name exists for each changed source file
// and, if so, includes its contents in the prompt. This file's
// *existence* and *path* is what the harness exercises; the body is
// not asserted on.
//
// node --test discovers `.test.ts` filenames recursively, so the body
// must remain a valid Node test file (no thrown imports). Keep this
// stub minimal — anything the host project's test runner would also
// pick up but pass.

import test from 'node:test';

test('seed fixture: api-contract-no-test-01 (intentional no-op)', () => {
  // No assertions. The collector cares about file presence; this entry
  // would normally hold the project's real payment.test.ts assertions.
});
