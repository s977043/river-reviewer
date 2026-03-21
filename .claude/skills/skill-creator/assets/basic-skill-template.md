---
name: your-skill-name
description: Explain what this skill does and when to use it. Include likely trigger phrases, user intents, and boundaries.
# disable-model-invocation: true
# allowed-tools: Read, Grep, Glob
# model: sonnet
---

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

## Additional resources

Load only when needed:

- `references/...`
- `assets/...`
- `scripts/...`
