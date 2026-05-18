// #802 Phase 3 PR-3: the river review CLI parser/dispatch and its core
// module must not have CODE coupling to PlanGate. The argument contract
// is defined purely by the Artifact Input Contract IDs; PlanGate is just
// one possible artifact producer (see
// pages/reference/artifact-input-contract.md "PlanGate 非依存性").
//
// This guard checks for *coupling* (imports, path/identifier string
// literals), not the word itself — explanatory comments are allowed to
// reference PlanGate (e.g. the PLANGATE_REVIEW_CLI_READY workflow flag
// name or the plangate-cli-roadmap doc).

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['src/cli.mjs', 'src/lib/review-plan.mjs', 'src/lib/review-plan-summary.mjs'];

/** Strip line and block comments so prose mentions don't trip the guard. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

test('review CLI parser/dispatch core has no PlanGate code coupling', () => {
  for (const rel of FILES) {
    const code = stripComments(readFileSync(resolve(root, rel), 'utf8'));
    assert.equal(
      /plangate/i.test(code),
      false,
      `${rel} must not couple to PlanGate in code (imports / path or identifier literals). ` +
        'Keep the CLI contract generic — Artifact Input Contract IDs only.'
    );
  }
});
