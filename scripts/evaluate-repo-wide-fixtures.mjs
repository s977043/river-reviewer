#!/usr/bin/env node
// CLI entry for the repo-wide eval harness (#688 PR-1).
//
// Usage:
//   node scripts/evaluate-repo-wide-fixtures.mjs
//   node scripts/evaluate-repo-wide-fixtures.mjs --cases path/to/cases.json
//   npm run eval:repo-context

import path from 'node:path';
import process from 'node:process';

import { evaluateRepoWideFixtures } from '../src/lib/repo-wide-fixtures-eval.mjs';

const DEFAULT_CASES = 'tests/fixtures/repo-wide-eval/cases.json';

function parseArgs(argv) {
  const args = [...argv];
  const out = { casesPath: DEFAULT_CASES, verbose: false };
  while (args.length) {
    const a = args.shift();
    if (a === '--cases') out.casesPath = args.shift() ?? DEFAULT_CASES;
    else if (a === '--verbose') out.verbose = true;
    else if (a === '-h' || a === '--help') {
      console.log(
        'Usage: evaluate-repo-wide-fixtures.mjs [--cases <path>] [--verbose]'
      );
      return null;
    }
  }
  return out;
}

async function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (!opts) return 0;
  const resolved = path.resolve(opts.casesPath);
  console.log(`# repo-wide eval`);
  console.log(`cases: ${resolved}`);
  const { summary, results } = await evaluateRepoWideFixtures({ casesPath: resolved });
  if (opts.verbose) {
    for (const r of results) {
      console.log(
        `\n## ${r.name} [${r.category}]\n  with-ctx findings:    ${r.withCtx.findingsCount}\n  without-ctx findings: ${r.withoutCtx.findingsCount}\n  context lift:         ${r.contextLift}`
      );
    }
  }
  console.log(`\n## Summary`);
  console.log(`  totalCases:           ${summary.totalCases}`);
  console.log(`  detectionRateWith:    ${summary.detectionRateWith.toFixed(2)}`);
  console.log(`  detectionRateWithout: ${summary.detectionRateWithout.toFixed(2)}`);
  console.log(`  contextLiftRate:      ${summary.contextLiftRate.toFixed(2)}`);
  console.log(`  categoriesCovered:    ${summary.categoriesCovered.join(', ') || '-'}`);
  return 0;
}

main(process.argv.slice(2)).then((code) => process.exit(code ?? 0));
