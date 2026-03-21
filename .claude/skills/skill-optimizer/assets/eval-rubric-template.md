# Eval rubric template

## Skill name

[skill-name]

## Baseline version

[current-version]

## Candidate change

[one change only]

## Criteria

1. Trigger quality
   - Pass:
   - Fail:

2. Gate quality
   - Pass:
   - Fail:

3. Task fidelity
   - Pass:
   - Fail:

4. Verification quality
   - Pass:
   - Fail:

5. Output contract compliance
   - Pass:
   - Fail:

## Test prompts

- prompt:
  expected:
  failure_mode_targeted:

- prompt:
  expected:
  failure_mode_targeted:

## Trial settings

- trials_per_case:
- baseline_run_count:
- candidate_run_count:

## Adoption rule

- no regression on critical criteria
- average score must improve
- if marginal, hold
- if safety worsens, reject

## Rollback rule

- if trigger precision drops
- if verification quality drops
- if failure recurrence increases
