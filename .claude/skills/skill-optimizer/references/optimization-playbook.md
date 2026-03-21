# Optimization playbook

Optimize in this order unless there is a strong reason not to:

1. description
2. gate questions
3. workflow order
4. examples
5. output contract
6. review checklist
7. supporting file split
8. tool restrictions

Use this sequence:

- identify one failure mode
- choose one smallest plausible fix
- define an eval hypothesis
- compare before vs after
- keep or revert

Good optimization targets:

- over-triggering
- under-triggering
- skipped clarification
- unsupported assumptions
- weak structure
- missing review
- excessive verbosity
- unnecessary tool use

Bad optimization targets:

- "make it better" without a metric
- multiple concurrent rewrites
- style changes without task benefit
- broader scope without boundary updates
