# Skill design principles

A good skill should have:

- one clear responsibility
- one obvious trigger profile
- explicit boundaries
- minimal main-file complexity
- visible assumptions
- a review step
- an eval plan

Prefer:

- narrow trigger language over broad wording
- reusable workflow over one-off prose
- supporting files over huge `SKILL.md`
- clear output contracts over stylistic guidance

Avoid:

- combining unrelated workflows
- hidden assumptions
- organization-specific facts without source material
- long examples in the main file
- side effects in auto-invoked skills

## Pattern selection rule

Before creating or optimizing any skill:

1. identify the primary failure or value source
2. map it to one primary pattern
3. add secondary patterns only when one pattern is insufficient
4. avoid pattern stacking unless each added pattern has a named phase and a measurable role

Available patterns:

- Tool Wrapper — domain knowledge injection on demand
- Generator — repeatable structured output from templates
- Reviewer — evaluation against a rubric or checklist
- Inversion — gather missing information before acting
- Pipeline — enforce strict multi-step workflow with checkpoints
