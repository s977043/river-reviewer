# Skill Template

The base template for creating new skills is located at `skills/_template.md`.

- For step-by-step instructions, see: `guides/add-new-skill`
- For specification and metadata details, see: `reference/skill-metadata`

## Template structure

The template consists of the following sections.

### Pattern declaration

Declares the design pattern adopted by the skill. The default for review skills is Reviewer.

| Pattern      | Primary use                                                            |
| ------------ | ---------------------------------------------------------------------- |
| Reviewer     | Evaluation against a checklist or criteria (default for review skills) |
| Inversion    | Gate that stops generation when required information is missing        |
| Pipeline     | Multi-step sequence control with checkpoints                           |
| Tool Wrapper | On-demand injection of domain knowledge                                |
| Generator    | Structured output from reusable templates                              |

### Pre-execution Gate

A hard condition that determines whether the skill should execute. When the condition is not met, the skill returns `NO_REVIEW` and generates no review comments.

Difference from False-positive guards:

- **Gate**: Determines whether to execute at all. No review if conditions are not met.
- **False-positive guards**: Determines whether to suppress individual findings after execution.

### Execution Steps

An optional section for complex skills to make the execution order explicit. Prevents step-skipping and improves output stability.

Leaf skills (execution skills) basic form:

1. **Gate**: Check Pre-execution Gate conditions
2. **Analyze**: Analyze the diff according to the Rule, collect evidence
3. **Output**: Generate results in the output format, evaluate Human Handoff conditions

Router skills (routing skills) basic form:

1. **Classify**: Classify the input and select the appropriate specialized skill(s)
2. **Execute**: Run the selected skills (note if parallel execution is possible)
3. **Aggregate**: Merge results, remove duplicates, and prioritize

## Related documentation

- Pattern design details: `.claude/skills/skill-creator/references/design-principles.md`
- Claude Code skill template: `.claude/skills/skill-creator/assets/basic-skill-template.md`
