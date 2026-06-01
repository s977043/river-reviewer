---
sidebar_label: Eval-based Keep / Discard Policy
---

# Eval-based Keep / Discard Policy

## Overview

Changes to River Review's skill / planner / routing / output policy must be accepted or rejected based on evaluation results. We avoid "I think this improved it" by comparing baseline vs. candidate entries recorded in the ledger.

## Evaluation metrics

| Metric                   | Description                                                  | Source                  |
| ------------------------ | ------------------------------------------------------------ | ----------------------- |
| planner coverage         | Share of expected skills that get selected                   | `npm run planner:eval`  |
| planner top1Match        | Top-priority-skill match rate                                | `npm run planner:eval`  |
| must_include recall      | Share of fixtures whose expected tokens appear in the output | `npm run eval:fixtures` |
| false positive rate      | Share of guard cases (`expectNoFindings`) that misfired      | `npm run eval:fixtures` |
| evidence attachment rate | Share of findings that include `Evidence:`                   | `npm run eval:fixtures` |
| severity consistency     | Share of findings whose severity aligns with the rubric      | (planned)               |
| meta consistency         | Version / tag consistency                                    | `npm run meta:validate` |

## Decision rules

### Conditions for Keep (accept)

A change is kept when at least one of the following holds:

1. **`must_include` recall improved** and no other metric regressed
2. **Recall is unchanged** and false positive rate decreased
3. **Recall is unchanged** and the implementation simplified (line reduction, dependency reduction)
4. **Planner coverage improved** and no other metric regressed

### Conditions for Discard (reject)

A change is discarded when any of the following holds:

1. **`evidence_rate` regressed** (more findings without grounding)
2. **Planner coverage dropped by more than 5%**
3. **`must_include` recall dropped**
4. **`npm test` or `npm run lint` failed**
5. **Crash (runtime error) occurred**

### When metrics conflict

- If multiple metrics conflict, decide in the priority order **`evidence_rate` > recall > false_positive_rate**.
- Small fluctuations (within ±2%) may not be statistically significant; confirm with at least two runs.

## Operational workflow

1. Before the change: run `npm run eval:all -- --append-ledger --description "baseline"`.
2. Make the change.
3. After the change: run `npm run eval:all -- --append-ledger --description "candidate: <change description>"`.
4. Compare the latest two entries in `artifacts/evals/results.jsonl`.
5. Decide keep / discard based on the rules above.
6. Document the decision rationale in the PR.

## References

- Adapted from [autoagent](https://github.com/kevinrgu/autoagent)'s keep / discard rules and translated for River Review.
- Multi-axis evaluation rather than single-metric (passed count) optimization.
