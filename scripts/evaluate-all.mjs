#!/usr/bin/env node
/**
 * Unified evaluation runner for River Reviewer.
 *
 * Bundles planner:eval, eval:fixtures, severity gate, and meta-consistency
 * into a single invocation. Outputs a JSON envelope and optionally appends
 * to the experiment ledger at artifacts/evals/results.jsonl.
 *
 * Usage:
 *   node scripts/evaluate-all.mjs [options]
 *
 * Options:
 *   --gate-input <path>    Path to River Reviewer JSON output for gate eval
 *   --append-ledger        Append result to artifacts/evals/results.jsonl
 *   --description <text>   Optional description for ledger entry
 *   --json                 Print result as JSON instead of human-readable
 *   --skip <name>          Skip a sub-eval (planner|fixtures|gate|meta). Repeatable
 *   -h, --help             Show help
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/** Minimum planner coverage to pass. Conservative initial baseline. */
const PLANNER_COVERAGE_THRESHOLD = 0.5;

/** Metric keys that represent 0-1 ratios (displayed as percentages). */
const RATIO_METRICS = new Set([
  'exactMatch',
  'top1Match',
  'coverage',
  'mrr',
  'passRate',
  'falsePositiveRate',
  'evidenceRate',
]);

// --- arg parsing -----------------------------------------------------------

function parseArgs(argv) {
  const args = [...argv];
  const parsed = {
    gateInput: null,
    appendLedger: false,
    description: '',
    json: false,
    skip: new Set(),
    help: false,
  };

  while (args.length) {
    const arg = args.shift();
    if (arg === '--gate-input') {
      parsed.gateInput = args.shift() ?? null;
    } else if (arg === '--append-ledger') {
      parsed.appendLedger = true;
    } else if (arg === '--description') {
      parsed.description = args.shift() ?? '';
    } else if (arg === '--json') {
      parsed.json = true;
    } else if (arg === '--skip') {
      const name = args.shift();
      if (name) parsed.skip.add(name);
    } else if (arg === '-h' || arg === '--help') {
      parsed.help = true;
    }
  }

  return parsed;
}

// --- git helpers ------------------------------------------------------------

function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function gitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

// --- result helpers ---------------------------------------------------------

function errorResult(name, message) {
  return { name, pass: false, skipped: false, metrics: {}, errors: [message] };
}

function skipResult(name) {
  return { name, pass: true, skipped: true, metrics: {}, errors: [] };
}

// --- sub-eval runners -------------------------------------------------------

async function runPlannerEval() {
  const { evaluatePlanner } = await import('../src/lib/planner-eval.mjs');
  const fixturePath = path.join(ROOT, 'tests', 'fixtures', 'planner-eval-cases.json');
  const data = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  const cases = data.map((c) => ({
    ...c,
    llmPlan: async ({ skills, context }) =>
      c.llmPlan ?? c.plan ?? c.expectedOrder.map((id) => ({ id })),
    skills: c.skills,
    context: c.context,
  }));

  const { summary } = await evaluatePlanner(cases);

  return {
    name: 'planner',
    pass: summary.coverage >= PLANNER_COVERAGE_THRESHOLD,
    skipped: false,
    metrics: {
      exactMatch: summary.exactMatch,
      top1Match: summary.top1Match,
      coverage: summary.coverage,
      mrr: summary.mrr,
    },
    errors: [],
  };
}

async function runFixturesEval() {
  const { evaluateReviewFixtures } = await import('../src/lib/review-fixtures-eval.mjs');
  const casesPath = path.join(ROOT, 'tests', 'fixtures', 'review-eval', 'cases.json');

  const result = await evaluateReviewFixtures({ casesPath, verbose: false });

  // Flatten top failure categories into metrics (preserves normalized result shape)
  const failureCats = result.summary.failuresByCategory ?? {};
  const topFailureMetrics = {};
  for (const [cat, count] of Object.entries(failureCats)) {
    topFailureMetrics[`fail_${cat}`] = count;
  }

  return {
    name: 'fixtures',
    pass: result.exitCode === 0,
    skipped: false,
    metrics: {
      passRate: result.summary.passRate,
      falsePositiveRate: result.summary.falsePositiveRate,
      evidenceRate: result.summary.evidenceRate,
      ...topFailureMetrics,
    },
    errors: result.exitCode === 0 ? [] : ['One or more fixture checks failed'],
  };
}

async function runGateEval(inputPath) {
  const { evaluateGate } = await import('./evaluate-review-gate.mjs');
  const result = await evaluateGate({ input: inputPath });

  return {
    name: 'gate',
    pass: result.pass,
    skipped: false,
    metrics: {},
    errors: result.pass ? [] : [result.summary],
  };
}

async function runMetaValidation() {
  const { validateMeta } = await import('./validate-meta-consistency.mjs');
  const errors = await validateMeta();

  return {
    name: 'meta',
    pass: errors.length === 0,
    skipped: false,
    metrics: { errorCount: errors.length },
    errors,
  };
}

// --- ledger -----------------------------------------------------------------

function appendLedger(entry) {
  const ledgerPath = path.join(ROOT, 'artifacts', 'evals', 'results.jsonl');
  const dir = path.dirname(ledgerPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.appendFileSync(ledgerPath, JSON.stringify(entry) + '\n');
}

// --- main -------------------------------------------------------------------

async function main() {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    console.log(`Usage: node scripts/evaluate-all.mjs [options]

Options:
  --gate-input <path>    Path to River Reviewer JSON output for gate eval
  --append-ledger        Append result to artifacts/evals/results.jsonl
  --description <text>   Optional description for ledger entry
  --json                 Print result as JSON
  --skip <name>          Skip a sub-eval (planner|fixtures|gate|meta). Repeatable
  -h, --help             Show help
`);
    return 0;
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

  // Run independent evals in parallel; gate depends on --gate-input flag
  const parallel = [];
  if (!parsed.skip.has('planner')) {
    parallel.push(
      runPlannerEval().catch((err) => errorResult('planner', `Planner eval error: ${err.message}`))
    );
  }
  if (!parsed.skip.has('fixtures')) {
    parallel.push(
      runFixturesEval().catch((err) =>
        errorResult('fixtures', `Fixtures eval error: ${err.message}`)
      )
    );
  }
  if (!parsed.skip.has('meta')) {
    parallel.push(
      runMetaValidation().catch((err) =>
        errorResult('meta', `Meta validation error: ${err.message}`)
      )
    );
  }

  const subResults = await Promise.all(parallel);

  // Gate requires --gate-input; handle separately
  if (!parsed.skip.has('gate') && parsed.gateInput) {
    const resolvedGateInput = path.resolve(parsed.gateInput);
    if (!fs.existsSync(resolvedGateInput)) {
      subResults.push(errorResult('gate', `Gate input file not found: ${parsed.gateInput}`));
    } else {
      try {
        subResults.push(await runGateEval(resolvedGateInput));
      } catch (err) {
        subResults.push(errorResult('gate', `Gate eval error: ${err.message}`));
      }
    }
  } else if (!parsed.skip.has('gate') && !parsed.gateInput) {
    subResults.push(skipResult('gate'));
  }

  // Build envelope
  const scores = {};
  for (const r of subResults) {
    for (const [k, v] of Object.entries(r.metrics)) {
      scores[`${r.name}_${k}`] = v;
    }
  }

  const envelope = {
    version: pkg.version,
    timestamp: new Date().toISOString(),
    commit: gitCommit(),
    branch: gitBranch(),
    scores,
    results: subResults
      .filter((r) => !r.skipped)
      .map((r) => ({
        name: r.name,
        pass: r.pass,
        errors: r.errors,
      })),
    status: subResults.every((r) => r.pass) ? 'pass' : 'fail',
    description: parsed.description || undefined,
  };

  if (parsed.json) {
    console.log(JSON.stringify(envelope, null, 2));
  } else {
    console.log(`\n=== River Reviewer Unified Evaluation ===`);
    console.log(`Commit: ${envelope.commit} (${envelope.branch})`);
    console.log(`Time:   ${envelope.timestamp}`);
    console.log(`Status: ${envelope.status.toUpperCase()}\n`);

    for (const r of subResults) {
      const icon = r.skipped ? 'SKIP' : r.pass ? 'PASS' : 'FAIL';
      console.log(`[${icon}] ${r.name}`);
      if (Object.keys(r.metrics).length) {
        for (const [k, v] of Object.entries(r.metrics)) {
          const display =
            typeof v === 'number' && RATIO_METRICS.has(k) ? `${(v * 100).toFixed(1)}%` : v;
          console.log(`       ${k}: ${display}`);
        }
      }
      if (r.errors.length) {
        for (const e of r.errors) {
          console.log(`       ! ${e}`);
        }
      }
    }

    console.log('');
  }

  if (parsed.appendLedger) {
    appendLedger(envelope);
    if (!parsed.json) {
      console.log(`Ledger entry appended to artifacts/evals/results.jsonl`);
    }
  }

  return envelope.status === 'pass' ? 0 : 1;
}

export { main as evaluateAll, parseArgs, appendLedger };

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('evaluate-all.mjs') || process.argv[1].endsWith('evaluate-all'));

if (isDirectRun) {
  main()
    .then((code) => {
      if (typeof code === 'number' && code !== 0) {
        process.exitCode = code;
      }
    })
    .catch((err) => {
      console.error(`Unified eval error: ${err.message}`);
      process.exitCode = 1;
    });
}
