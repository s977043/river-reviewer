# Evaluation Rubric Reference

## Overview

River Reviewer's evaluation system supports multi-dimensional rubric scoring in addition to traditional inclusion-based checks (must_include token matching).

## Rubric Dimensions

| ID | Name | Method | Auto | Weight | Existing Metric |
|----|------|--------|------|--------|-----------------|
| `detection_accuracy` | Detection Accuracy | ratio | ✅ | 0.25 | passRate |
| `false_positive_rate` | False Positive Rate | ratio | ✅ | 0.20 | falsePositiveRate |
| `evidence_quality` | Evidence Quality | ratio | ✅ | 0.15 | evidenceRate |
| `severity_alignment` | Severity Alignment | ratio | ✅ | 0.15 | (new) |
| `phase_consistency` | Phase Consistency | binary | ✅ | 0.10 | (new) |
| `actionability` | Actionability | manual | ❌ | 0.10 | (new) |
| `token_efficiency` | Token Efficiency | ratio | ✅ | 0.05 | (new) |

## Scoring Methods

| Method | Description | Value Range |
|--------|-------------|-------------|
| `binary` | Pass/fail binary judgment | 0 or 1 |
| `ratio` | Success count / total count | 0.0 – 1.0 |
| `manual` | Subjective human evaluation | null (unevaluated) or 0.0 – 1.0 |

## Weight

Dimension weights sum to 1.0 and are used to compute a weighted average score. Users can adjust weights by editing `eval/rubric.yaml`.

## Relationship to Existing Fixtures

Current fixture-based evaluation (must_include token matching) maps to these dimensions:

- `detection_accuracy` ← passRate (detection rate of expected findings)
- `false_positive_rate` ← falsePositiveRate (false positive rate in guard cases)
- `evidence_quality` ← evidenceRate (Evidence token occurrence rate)

New dimensions (`severity_alignment`, `phase_consistency`, `actionability`, `token_efficiency`) can be incrementally automated by adding metadata to fixtures.

## dimensionScores (eval-ledger-entry)

Evaluation results are recorded in the `dimensionScores` field of `eval-ledger-entry.schema.json`:

```json
{
  "dimensionScores": [
    { "dimensionId": "detection_accuracy", "score": 0.85, "method": "ratio" },
    { "dimensionId": "actionability", "score": null, "method": "manual", "details": "Not yet evaluated" }
  ]
}
```

`manual` dimensions are recorded with `score: null`, awaiting human review.

## Trade-offs and Limitations

- **Automation limits**: `actionability` requires natural language semantics analysis and is difficult to fully automate
- **phase_consistency**: Important as a core differentiator for River Reviewer, but defining ground-truth phase labels requires design decisions
- **token_efficiency**: Remains a provisional metric until Context Budget is formally defined

## Related

- [Schema: eval-rubric.schema.json](/schemas/eval-rubric.schema.json)
- [Schema: eval-ledger-entry.schema.json](/schemas/eval-ledger-entry.schema.json)
- [Fixture Format Reference](./evaluation-fixture-format.en.md)
- [Glossary](./glossary.en.md)
