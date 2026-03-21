# Optimization playbook

Optimize in this order unless there is a strong reason not to:

1. pattern mismatch
2. description
3. gate questions
4. workflow order
5. examples
6. output contract
7. review checklist
8. supporting file split
9. tool restrictions

Use this sequence:

- identify one failure mode
- choose one smallest plausible fix
- define an eval hypothesis
- compare before vs after
- keep or revert

Good optimization targets:

- pattern mismatch (wrong primary pattern or missing secondary)
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
