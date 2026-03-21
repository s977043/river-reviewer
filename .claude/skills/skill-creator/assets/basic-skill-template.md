---
name: your-skill-name
description: Explain what this skill does and when to use it. Include likely trigger phrases, user intents, and boundaries.
# disable-model-invocation: true
# allowed-tools: Read, Grep, Glob
# model: sonnet
---

## Pattern declaration

Primary pattern:

- [Tool Wrapper | Generator | Reviewer | Inversion | Pipeline]

Secondary patterns:

- [optional]

Pattern intent:

- explain why this skill uses this pattern
- explain why the other patterns are not primary

## Purpose

State the single responsibility of this skill in 1 to 3 sentences.

## Use this skill when

- the user asks ...
- the task requires ...
- likely trigger phrases include ...

## Do not use this skill when

- the task is really about ...
- the user needs ...
- side effects would be unsafe without explicit invocation

## Phase 0: Gate

Before doing substantial work, confirm:

- objective
- audience
- scope
- constraints
- source material
- definition of done

If required context is missing:

- ask the minimum focused questions, or
- inspect available files first

## Phase 1: Working summary

Create a short internal summary of:

- requested deliverable
- confirmed constraints
- open questions
- risks from missing context

## Phase 2: Evidence collection

Collect the minimum reliable evidence needed.

Preferred order:

1. explicit user-provided material
2. repository files
3. linked references
4. external sources only when needed

Rules:

- prefer source-of-truth material
- do not invent facts
- surface conflicts when sources disagree

## Phase 3: Plan

Create a compact plan before execution:

- sections or steps
- source mapping
- remaining assumptions
- validation approach

## Phase 4: Execution

Do the task according to the plan.

Rules:

- follow required structure
- keep assumptions visible
- mark missing evidence explicitly
- prefer concrete statements over filler

## Phase 5: Review

Check:

- objective is answered
- scope is respected
- required sections exist
- assumptions are explicit
- unsupported claims are removed or labeled
- risky actions are clearly called out

## Output contract

Return:

- final result
- explicit assumptions
- unresolved questions
- next highest-value follow-up

## Pattern composition rules

Use Tool Wrapper when:

- the main value is domain knowledge or conventions loaded on demand

Use Generator when:

- the main value is producing repeatable structured output

Use Reviewer when:

- the main value is checking against a rubric or checklist

Use Inversion when:

- the skill should ask structured questions before acting

Use Pipeline when:

- the skill must enforce stage order and checkpoints

If multiple patterns are used:

- one pattern must remain primary
- each secondary pattern must appear in a named phase
- do not combine patterns without a clear reason

## Recommended phase structure by pattern

For Tool Wrapper:

- Purpose
- Use this skill when
- Knowledge boundaries
- References to load on demand

For Generator:

- Gate
- Inputs required
- Template selection
- Draft
- Review
- Finalize

For Reviewer:

- Review scope
- Severity model
- Checklist loading
- Findings
- Verdict

For Inversion:

- Required questions
- Stop condition until answers are sufficient
- Confirmed inputs
- Proceed or block

For Pipeline:

- Stage 1
- Stage 2
- Stage 3
- Checkpoint after each stage
- Stop if checkpoint fails

## Additional resources

Load only when needed:

- `references/...`
- `assets/...`
- `scripts/...`
