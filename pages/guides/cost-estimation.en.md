# Cost estimation and optimization guide

This guide helps you (a) estimate the monthly cost of running river-review for your team / project before adoption, and (b) verify those estimates with measured numbers once you start running it. It answers the requirements raised in Issue [#803](https://github.com/s977043/river-review/issues/803).

> Pricing lives in `src/core/cost-estimator.mjs` under `MODEL_PRICES` (with a `PRICING_LAST_UPDATED` constant). Update that table whenever provider pricing changes.

## 1. Cost breakdown

A single review run makes one LLM call per **(skill × file)** pair. The cost of each call is the sum of:

| Component             | Example unit price (claude-sonnet-4-6) | Notes                                                      |
| --------------------- | -------------------------------------- | ---------------------------------------------------------- |
| Fresh input tokens    | `$3.00 / 1M`                           | systemPrompt + diff + context that misses the prompt cache |
| Cache read tokens     | `$0.30 / 1M`                           | **10% of the input rate** (Anthropic ephemeral cache)      |
| Cache write surcharge | `+25%` of input rate                   | Anthropic only; charged once per cache key                 |
| Output tokens         | `$15.00 / 1M`                          | Review text                                                |

OpenAI models (`gpt-4o-mini` etc.) follow the same shape, but cache reads are billed at **50% of input** instead of 10%.

### Per-call formula

```text
USD = (fresh_input / 1000) * inputPer1k
    + (cache_read   / 1000) * cacheReadPer1k
    + (cache_create / 1000) * inputPer1k * 0.25   # Anthropic only
    + (output       / 1000) * outputPer1k
```

The reference implementation is `CostEstimator.estimateFromUsage(usage)`.

## 2. Scenario estimates

Numbers below are **estimates** based on the current `MODEL_PRICES` table. Replace them with measured values from [Section 4](#4-measuring-actual-costs) once you have data from your own repository.

### 2-1. Small PR (50-line diff, midstream only, planner=off)

| Input          | Value                       |
| -------------- | --------------------------- |
| diff tokens    | ~600 (50 lines × 12 tokens) |
| skills matched | 5 (security family)         |
| systemPrompt   | ~800 tokens                 |
| output         | ~300 tokens / call          |
| model          | `claude-sonnet-4-6`         |

First run (no cache hits):

```text
input  = (800 + 600) × 5 = 7,000
output = 300 × 5 = 1,500
USD    = 7,000/1000 × 0.003 + 1,500/1000 × 0.015 = $0.021 + $0.0225 = $0.0435
```

Subsequent runs hitting the prompt cache:

```text
fresh_input    = 600 × 5 = 3,000
cache_read     = 800 × 5 = 4,000
output         = 1,500
USD = 3,000/1000 × 0.003 + 4,000/1000 × 0.0003 + 1,500/1000 × 0.015
    = $0.009 + $0.0012 + $0.0225 = $0.0327   (~25% cheaper)
```

### 2-2. Medium PR (300-line diff, midstream + orchestrator with 3 parallel roles)

| Input              | Value                                      |
| ------------------ | ------------------------------------------ |
| diff tokens        | ~3,600                                     |
| skills             | 8                                          |
| orchestrator roles | 3 (bug-hunter, security-scanner, test-gap) |
| model              | `claude-sonnet-4-6`                        |

```text
calls = 8 × 3 = 24
input/call  = 800 + 3,600 = 4,400
output/call = 600
input_total  = 24 × 4,400 = 105,600
output_total = 24 × 600 = 14,400
USD ≒ 105.6 × 0.003 + 14.4 × 0.015 = $0.317 + $0.216 = $0.533
```

With prompt caching ON and 23 of 24 calls hitting the cache, **expect a 30-40% reduction**.

### 2-3. Large PR (1000-line diff, upstream + midstream, planner=prune)

| Input                 | Value               |
| --------------------- | ------------------- |
| diff tokens           | ~12,000             |
| skills (before prune) | 12                  |
| planner=prune leaves  | 5                   |
| model                 | `claude-sonnet-4-6` |

```text
calls (after prune) = 5
input/call  = 800 + 12,000 = 12,800
output/call = 1,000
input_total  = 5 × 12,800 = 64,000
output_total = 5 × 1,000 = 5,000
USD ≒ 64 × 0.003 + 5 × 0.015 = $0.192 + $0.075 = $0.267
```

Without pruning the same PR costs **~$0.64** (12 / 5 = 2.4x). Planner pruning is high-leverage on large diffs.

## 3. Optimization levers

### 3-1. Keep prompt caching on

Anthropic ephemeral prompt caching (PR [#811](https://github.com/s977043/river-review/pull/811)) reuses systemPrompt for 5 minutes with a ~90% input-token discount on hits. Global off switch: `RIVER_ANTHROPIC_PROMPT_CACHE=0`. Per-skill off switch: `skill.disableCache: true`. Default ON is the right choice in almost every case.

### 3-2. Use `planner=prune` on large diffs

Tighten `config.skills[].applyTo` and rely on `planner: prune` to drop irrelevant skills before invocation. Expect 2-3x savings on large PRs.

### 3-3. Match the model to the workload

| Workload                         | Recommended model                 | Input cost ratio |
| -------------------------------- | --------------------------------- | ---------------- |
| Lightweight lint / pattern check | `claude-haiku-4-5`, `gpt-4o-mini` | 1x baseline      |
| Balanced                         | `claude-sonnet-4-6`, `gpt-4o`     | 3-25x            |
| Critical review                  | `claude-opus-4-7`, `o1`           | 15-100x          |

Use `SkillSchema.modelHint: cheap` for blanket downgrading, or set `model` per skill for fine control.

### 3-4. Combine `--estimate` and `--max-cost`

```bash
node src/cli.mjs run --estimate --max-cost 1.50
```

`--max-cost` aborts before incurring spend; pair with CI to cap runaway costs.

## 4. Measuring actual costs

The PR #813 / #814 telemetry pipeline lets you collect real usage from your own pipeline:

### Step 1. Opt in

```bash
export RIVER_USAGE_TELEMETRY=1   # writes JSONL to artifacts/usage/
export RIVER_AI_RETRY_DEBUG=1    # also logs each call to stdout (optional)
```

### Step 2. Run a review

Run the dispatcher as usual (e.g. `npm run river -- review`). On completion, the dispatcher writes `artifacts/usage/<YYYY-MM-DD>-<runId>.jsonl` with one line per (file, skill):

```json
{
  "timestamp": "2026-05-14T05:55:00.000Z",
  "runId": "abcd1234",
  "commit": "deadbeef",
  "file": "src/auth.mjs",
  "skill": "security",
  "provider": "anthropic",
  "model": "claude-sonnet-4-6",
  "inputTokens": 1234,
  "outputTokens": 567,
  "cacheCreationInputTokens": 100,
  "cacheReadInputTokens": 50
}
```

### Step 3. Aggregate

```bash
npm run usage:summary                  # group by model (default, human-readable)
npm run usage:summary -- --group skill # group by skill
npm run usage:summary -- --group run   # group by run
npm run usage:summary -- --group day   # group by date
npm run usage:summary -- --json        # JSON output for external tooling
```

Example output:

```text
Group: model
  claude-sonnet-4-6            calls=  24 in=  105600 out=  14400 cacheRead=  84800 hit= 80.3% usd=$0.3210
  gpt-4o-mini                  calls=   8 in=    8000 out=    400 cacheRead=    3500 hit= 43.8% usd=$0.0014

  TOTAL                        calls=  32 in=  113600 out=  14800 cacheRead=  88300              usd=$0.3224
```

### Step 4. Monthly projection

Aggregate one to four weeks of `artifacts/usage/` data, divide total `usd` by the number of PRs to get a per-PR average, then multiply by your monthly PR volume.

## 5. Pricing reference

`PRICING_LAST_UPDATED = 2026-05-14` (USD per 1M tokens). Verify against [Anthropic pricing](https://www.anthropic.com/pricing) / [OpenAI pricing](https://openai.com/pricing) before reporting hard numbers.

| Model               | Input  | Output | Cache Read |
| ------------------- | ------ | ------ | ---------- |
| `claude-opus-4-7`   | $15.00 | $75.00 | $1.50      |
| `claude-sonnet-4-6` | $3.00  | $15.00 | $0.30      |
| `claude-haiku-4-5`  | $1.00  | $5.00  | $0.10      |
| `gpt-4o`            | $2.50  | $10.00 | $1.25      |
| `gpt-4o-mini`       | $0.15  | $0.60  | $0.075     |
| `o1`                | $15.00 | $60.00 | —          |
| `o1-mini`           | $3.00  | $12.00 | —          |
| `gpt-4-turbo`       | $10.00 | $30.00 | —          |
| `gpt-3.5-turbo`     | $0.50  | $1.50  | —          |

Anthropic cache writes are billed at **+25% of input**; cache reads at **10%**. OpenAI cache reads are billed at **50%** of input.

## 6. Related links

- Implementation: `src/core/cost-estimator.mjs`, `src/lib/usage-persistence.mjs`
- Script: `scripts/usage-summary.mjs`
- Related PRs: [#811](https://github.com/s977043/river-review/pull/811), [#813](https://github.com/s977043/river-review/pull/813), [#814](https://github.com/s977043/river-review/pull/814)
- Related issue: [#803](https://github.com/s977043/river-review/issues/803)
