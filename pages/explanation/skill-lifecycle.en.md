---
id: skill-lifecycle-en
---

# Skill Lifecycle

This document outlines the operational guidelines for adoption, training, and evaluation to ensure skills are not simply "created and forgotten."

## 1. Adoption

- Purpose: Clarify which review responsibilities the skill will replace or supplement.
- Target phase: Decide whether it belongs in upstream, midstream, or downstream.
- Responsibility boundary: Define which decisions the skill handles and where to hand off to humans.
- Evaluation criteria: Establish pass and fail criteria upfront.

### Additional Checklist

- Verify no overlap with existing skills.
- Determine whether the existing rubric suffices or new items are needed.
- Confirm alignment with the existing schema.

## 2. Training

- Prepare examples and golden cases.
- Cover three categories: typical cases, failure cases, and edge cases.
- Verify that the skill's output format fits the review workflow.

## 3. Evaluation

- Score against the rubric and determine pass/fail.
- Run automated evaluation in CI to detect regressions.
- If the score falls below the threshold, fix immediately or revert to human review.

### Evaluation Checkpoints

- Is the balance between false positives and missed detections maintained?
- Are findings specific enough to lead to actionable fixes?
- Is the impact explanation neither too brief nor too verbose?

## 4. Iterative Operation

- Retain change history and evaluation results to support improvement decisions.
- When a declining trend is observed, retrain or redesign the skill.

## 5. Guardrails

- Define explicit signals for when the skill is uncertain.
- Never compromise the assumption that humans make the final decision.
