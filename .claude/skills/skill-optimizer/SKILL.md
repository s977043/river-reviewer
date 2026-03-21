---
name: skill-optimizer
description: Evaluate and improve an existing Claude Code skill using explicit success criteria and small controlled changes. Use when the user asks to optimize a skill, reduce over-triggering or under-triggering, improve reliability, tighten instructions, or add evals for a skill. Also trigger on "スキルを改善して", "スキルを最適化して", "スキルの品質を確認して".
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash
---

## Purpose

Improve an existing skill without breaking what already works.

Your job is to:

1. inspect the current skill package
2. define or refine success criteria
3. identify failure modes
4. propose one small change at a time
5. attach each change to an eval hypothesis
6. reject changes that cannot be evaluated

## Core optimization rule

Never apply a large rewrite first.

Optimize in small units:

- description
- gate logic
- workflow order
- examples
- prohibited behaviors
- output contract
- review checklist
- supporting file structure

Change only one major unit per proposal.

## Phase 0: Baseline audit

Inspect:

- current `SKILL.md`
- current supporting files
- invocation settings
- current examples
- current failure reports or user complaints
- existing eval cases if any

Then summarize:

- what the skill is supposed to do
- where it fails
- whether the issue is discovery, execution, or validation

## Phase 1: Success criteria

Define 3 to 6 evaluation criteria.

Each criterion must be:

- specific
- observable
- pass/fail or narrowly scored

Separate:

- trigger quality
- task fidelity
- completeness
- safety / side effects
- output format compliance

## Phase 2: Failure mapping

Classify failures into:

- over-triggering
- under-triggering
- missing context collection
- vague output
- hallucinated assumptions
- skipped verification
- unnecessary tool use
- high token or step cost

## Phase 3: Optimization proposal

For each proposed change, output:

- change id
- exact file to modify
- exact section to modify
- exact change summary
- reason
- expected benefit
- risk
- eval method
- rollback condition

Prefer the smallest useful change.

## Phase 4: Eval plan

For the recommended next change, define:

- baseline measurement
- test prompts
- grading method
- number of trials
- adoption threshold
- rollback threshold

Use `${CLAUDE_SKILL_ROOT}/assets/eval-rubric-template.md` as the rubric structure.

Default stance:

- do not adopt on a single successful run
- do not accept regressions on critical criteria

## Phase 5: Review

Check against:

- `${CLAUDE_SKILL_ROOT}/references/review-default.md`
- `${CLAUDE_SKILL_ROOT}/references/optimization-playbook.md`

Before finalizing, verify:

- no broad rewrites without evidence
- no hidden assumptions
- no unverifiable claims
- no changes that weaken safety or review steps
- no new ambiguity in the description

## Output format

Return exactly these sections:

### Baseline summary

### Success criteria

### Failure modes

### Recommended next change

### Eval plan

### Rollback rule

### Follow-up changes backlog

## Anti-patterns

Do not:

- rewrite the whole skill first
- mix multiple major changes in one proposal
- optimize without a baseline
- optimize only for style
- remove verification to save tokens
- broaden description without evidence

## Failure handling

If the current skill is structurally unsalvageable:

- say so directly
- recommend a replacement design
- explain why incremental optimization is not appropriate
