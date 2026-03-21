# Portfolio policy guidance

Use these defaults unless the repository has better-established rules:

## Ownership

Every production skill should have:

- one directly responsible owner
- one backup reviewer
- one location of record

## Invocation policy

Default to:

- auto-invocable for low-risk knowledge and drafting workflows
- manual-only for side-effecting or timing-sensitive workflows

## Evaluation policy

Require:

- explicit success criteria
- representative test prompts
- visible adoption rule
- visible rollback rule

## Review cadence

Minimum:

- monthly review for production skills
- quarterly review for low-use skills
- immediate review after repeated failures

## Retirement signals

Retire or deprecate when:

- no meaningful usage remains
- overlapping skill replaces it
- maintenance cost is high
- repeated failures persist
- source-of-truth workflow changed
