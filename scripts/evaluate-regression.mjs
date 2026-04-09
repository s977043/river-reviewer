#!/usr/bin/env node
/**
 * Regression evaluation runner for River Reviewer governance features.
 * Usage: node scripts/evaluate-regression.mjs [--cases <path>] [--verbose]
 */
import path from 'node:path';
import url from 'node:url';
import { evaluateRegression } from '../src/lib/regression-eval.mjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const DEFAULT_CASES = path.join(__dirname, '..', 'tests', 'fixtures', 'regression-eval', 'cases.json');

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const casesIdx = args.indexOf('--cases');
  const casesPath = casesIdx >= 0 ? args[casesIdx + 1] : DEFAULT_CASES;

  console.log('Running regression evaluation...');
  const result = await evaluateRegression({ casesPath, verbose });

  console.log('\n=== Regression Eval Results ===');
  console.log('Total: ' + result.summary.total);
  console.log('Pass: ' + result.summary.pass);
  console.log('Fail: ' + result.summary.fail);
  console.log('Policy pass rate: ' + (result.summary.policyPassRate * 100).toFixed(1) + '%');
  console.log('Memory recall rate: ' + (result.summary.memoryRecallRate * 100).toFixed(1) + '%');
  console.log('Suppression accuracy: ' + (result.summary.suppressionAccuracy * 100).toFixed(1) + '%');
  console.log('Resurface accuracy: ' + (result.summary.resurfaceAccuracy * 100).toFixed(1) + '%');

  if (result.summary.fail > 0) {
    console.log('\nFailing cases:');
    for (const c of result.cases.filter((r) => !r.pass)) {
      console.log('  - ' + c.name + (c.error ? ': ' + c.error : ''));
    }
  }

  return result.exitCode;
}

main().then((code) => { process.exitCode = code; }).catch((err) => { console.error(err.message); process.exitCode = 1; });
