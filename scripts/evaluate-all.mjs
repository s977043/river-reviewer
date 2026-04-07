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

// --- sub-eval runners -------------------------------------------------------

async function runPlannerEval() {
  const { evaluatePlanner } = await import('../src/lib/planner-eval.mjs');
  const fixturePath = path.join(ROOT, 'tests', 'fixtures', 'planner-eval-cases.json');
  const data = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  const cases = data.map((c) => ({
    ...c,
    llmPlan: async () => c.llmPlan ?? c.plan ?? c.expectedOrder.map((id) => ({ id })),
    skills: c.skills,
    context: c.context,
  }));

  const { summary } = await evaluatePlanner(cases);

  return {
    name: 'planner',
    pass: summary.coverage >= 0.5,
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

  const exitCode = await evaluateReviewFixtures({ casesPath, verbose: false });

  return {
    name: 'fixtures',
    pass: exitCode === 0,
    metrics: {
      exitCode,
    },
    errors: exitCode === 0 ? [] : ['One or more fixture checks failed'],
  };
}

async function runGateEval(inputPath) {
  const { evaluateGate } = await import('./evaluate-review-gate.mjs');
  const result = await evaluateGate({ input: inputPath });

  return {
    name: 'gate',
    pass: result.pass,
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
    metrics: {
      errorCount: errors.length,
    },
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

  const subResults = [];

  if (!parsed.skip.has('planner')) {
    try {
      subResults.push(await runPlannerEval());
    } catch (err) {
      subResults.push({
        name: 'planner',
        pass: false,
        metrics: {},
        errors: [`Planner eval error: ${err.message}`],
      });
    }
  }

  if (!parsed.skip.has('fixtures')) {
    try {
      subResults.push(await runFixturesEval());
    } catch (err) {
      subResults.push({
        name: 'fixtures',
        pass: false,
        metrics: {},
        errors: [`Fixtures eval error: ${err.message}`],
      });
    }
  }

  if (!parsed.skip.has('gate') && parsed.gateInput) {
    try {
      subResults.push(await runGateEval(path.resolve(parsed.gateInput)));
    } catch (err) {
      subResults.push({
        name: 'gate',
        pass: false,
        metrics: {},
        errors: [`Gate eval error: ${err.message}`],
      });
    }
  }

  if (!parsed.skip.has('meta')) {
    try {
      subResults.push(await runMetaValidation());
    } catch (err) {
      subResults.push({
        name: 'meta',
        pass: false,
        metrics: {},
        errors: [`Meta validation error: ${err.message}`],
      });
    }
  }

  // Build envelope
  const allPass = subResults.every((r) => r.pass);
  const scores = {};
  for (const r of subResults) {
    for (const [k, v] of Object.entries(r.metrics)) {
      scores[`${r.name}_${k}`] = v;
    }
  }

  const envelope = {
    timestamp: new Date().toISOString(),
    commit: gitCommit(),
    branch: gitBranch(),
    scores,
    results: subResults.map((r) => ({
      name: r.name,
      pass: r.pass,
      errors: r.errors,
    })),
    status: allPass ? 'pass' : 'fail',
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
      const icon = r.pass ? 'PASS' : 'FAIL';
      console.log(`[${icon}] ${r.name}`);
      if (Object.keys(r.metrics).length) {
        for (const [k, v] of Object.entries(r.metrics)) {
          const display = typeof v === 'number' && v <= 1 && v >= 0 ? `${(v * 100).toFixed(1)}%` : v;
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

  return allPass ? 0 : 1;
}

export { main as evaluateAll };

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
