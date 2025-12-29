# River Reviewer Skills

This directory contains River Reviewer skills - reusable code review patterns organized by SDLC phase.

## What are Skills?

Skills are modular, version-controlled review patterns that encapsulate:

- **Review logic** - What to check and how to check it
- **Context requirements** - What information the skill needs (diff, full file, tests, etc.)
- **Evaluation criteria** - How to measure the skill's effectiveness
- **Test fixtures** - Sample inputs and expected outputs

Each skill is a **first-class asset** with its own version, tests, and documentation.

## Directory Structure

```text
skills/
├── README.md                  # This file
├── registry.yaml              # Skill catalog
├── _template.md               # Legacy template (YAML frontmatter format)
├── upstream/                  # Design & Architecture phase
│   ├── rr-upstream-adr-*.md   # ADR-related skills
│   └── ...
├── midstream/                 # Implementation phase
│   ├── rr-midstream-code-*.md # Code quality skills
│   └── ...
└── downstream/                # Testing & Release phase
    ├── rr-downstream-test-*.md # Test-related skills
    └── ...
```

## Skill Formats

River Reviewer supports two skill formats:

### 1. YAML Frontmatter Format (Legacy)

Single Markdown file with YAML frontmatter:

```markdown
---
id: rr-midstream-example-001
name: Example Skill
description: Example skill description
phase: midstream
applyTo: ['src/**/*.ts']
---

## Review Logic

[Skill implementation here]
```

### 2. Skill Registry Format (Recommended)

Structured directory with separate files:

```text
rr-midstream-example-001/
├── skill.yaml              # Metadata
├── README.md               # Documentation
├── prompt/
│   ├── system.md          # System prompt
│   └── user.md            # User prompt
├── fixtures/              # Test inputs
├── golden/                # Expected outputs
└── eval/
    └── promptfoo.yaml     # Evaluation config
```

See [\_template.md](./_template.md) and [skill.schema.json](../schemas/skill.schema.json) for the full specification.

## Creating a New Skill

### Using the Scaffolding Tool (Recommended)

```bash
npm run create:skill
```

This interactive tool will:

1. Prompt for skill metadata (ID, name, description, etc.)
2. Generate the skill directory structure
3. Create template files with placeholders

### Manual Creation

1. Copy the template:

   ```bash
   cp skills/_template.md skills/<phase>/<skill-id>.md
   ```

2. Edit `skill.yaml` with your skill metadata
3. Implement the review logic in `prompt/system.md` and `prompt/user.md`
4. Add test fixtures and expected outputs
5. Configure evaluation in `eval/promptfoo.yaml`

## Validating Skills

### Validate skill.yaml Format

```bash
npm run validate:skill-yaml
```

### Validate Legacy Format (YAML Frontmatter)

```bash
npm run skills:validate
```

## Testing Skills

### Run promptfoo Evaluation

```bash
cd skills/<phase>/<skill-id>
npx promptfoo eval
```

### Run All Fixture Tests

```bash
npm run eval:fixtures
```

## Skill Phases

### Upstream (Design & Architecture)

Focus: Design decisions, ADRs, architecture patterns

- **Input Context**: ADR files, design docs, commit messages
- **Output**: Design feedback, alternative suggestions, questions
- **Examples**: ADR quality, API design review, architecture patterns

### Midstream (Implementation)

Focus: Code quality, security, observability

- **Input Context**: Diff, full files, tests
- **Output**: Code findings, refactoring suggestions, security alerts
- **Examples**: Code quality, security scan, observability checks

### Downstream (Testing & Release)

Focus: Test coverage, release readiness

- **Input Context**: Test files, coverage reports, diff
- **Output**: Test recommendations, coverage gaps, release checklist
- **Examples**: Test coverage, integration test review

## Registry

The `registry.yaml` file maintains a catalog of all skills with:

- Skill metadata and versions
- Tag-based categorization
- Recommended skills for common use cases
- Phase-based organization

See [registry.yaml](./registry.yaml) for the complete catalog.

## Best Practices

1. **One skill, one concern** - Keep skills focused on a single review aspect
2. **Write tests** - Add fixtures and golden files for regression testing
3. **Document thoroughly** - Include clear examples and non-goals
4. **Version carefully** - Use semantic versioning for breaking changes
5. **Evaluate regularly** - Run promptfoo evaluations to measure effectiveness

## References

<!-- - [Skill YAML Specification](../specs/skill-yaml-spec.md) -->
<!-- - [Skill Template](../specs/templates/skill/) -->

- [promptfoo Documentation](https://www.promptfoo.dev/)
- [River Reviewer Documentation](../DOCUMENTATION.md)
