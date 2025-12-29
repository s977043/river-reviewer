# Core Runner

Core skill execution components for River Reviewer.

## Overview

The core runner provides the foundational skill loading and execution planning functionality for River Reviewer. It handles:

- Loading and validating skills from the skills registry
- Routing changed files to appropriate skills based on phase, file patterns, and context
- Building execution plans with skill prioritization and planning

## API Reference

### skill-loader.mjs

Handles loading, parsing, and validating skill definitions.

#### Key Exports (skill-loader)

- `loadSkills(options)` - Load all skills from the skills directory
- `loadSkillFile(filePath, options)` - Load a single skill file
- `loadSchema(schemaPath)` - Load the skill schema for validation
- `createSkillValidator(schema)` - Create a skill validator from schema
- `parseFrontMatter(content)` - Parse YAML front matter from markdown
- `SkillLoaderError` - Custom error class for skill loading errors
- `defaultPaths` - Default paths for skills directory and schema

#### Usage Example (skill-loader)

```javascript
import { loadSkills } from './skill-loader.mjs';

// Load all skills with default settings
const skills = await loadSkills();

// Load skills from custom directory
const customSkills = await loadSkills({
  skillsDir: '/path/to/skills',
  schemaPath: '/path/to/schema.json',
});
```

### review-runner.mjs

Handles skill selection, routing, and execution plan building.

#### Key Exports (review-runner)

- `buildExecutionPlan(options)` - Build an execution plan from skills and context
- `selectSkills(skills, options)` - Select skills matching phase and file patterns
- `matchesPhase(skill, phase)` - Check if skill matches a review phase
- `rankByModelHint(skills, preferredModelHint)` - Rank skills by model hint preference
- `summarizeSkill(skill)` - Create a summary of skill metadata

#### Usage Example (review-runner)

```javascript
import { buildExecutionPlan } from './review-runner.mjs';

const plan = await buildExecutionPlan({
  phase: 'midstream',
  changedFiles: ['src/app.ts', 'src/utils.ts'],
  availableContexts: ['diff', 'fullFile'],
  preferredModelHint: 'balanced',
});

console.log(`Selected ${plan.selected.length} skills`);
console.log(`Skipped ${plan.skipped.length} skills`);
```

## Skill Selection Logic

Skills are selected based on multiple criteria:

1. **Phase Match**: Skill's `phase` field must match the requested review phase
2. **File Pattern Match**: At least one changed file must match the skill's `applyTo` glob patterns
3. **Input Context**: Required `inputContext` values must be available
4. **Dependencies**: Required `dependencies` must be available

## Skill Ranking

When multiple skills are selected, they are ranked by:

1. **Impact Tags**: Skills matching inferred impact tags are prioritized
2. **Model Hint**: Skills matching the preferred model hint are ranked higher
3. **Skill ID**: Alphabetical ordering as a tiebreaker

## Directory Structure

```text
runners/core/
├── skill-loader.mjs    # Skill loading and validation
├── review-runner.mjs   # Skill selection and execution planning
├── package.json        # Package dependencies
└── README.md           # This file
```

## Dependencies

Core dependencies (from package.json):

- `js-yaml` - YAML parsing for skill files
- `minimatch` - Glob pattern matching for file routing
- `ajv` - JSON schema validation
- `ajv-formats` - Additional validation formats for Ajv

## Testing

Tests for core runner functionality are located in `/tests`:

- `tests/skill-loader.test.mjs` - Skill loading tests
- `tests/skill-loader-v2.test.mjs` - Extended skill loading tests
- `tests/review-runner.test.mjs` - Execution plan tests
- `tests/review-runner-phase.test.mjs` - Phase matching tests
- `tests/review-runner.snapshot.test.mjs` - Snapshot tests
- `tests/skill-routing-regression.test.mjs` - Routing regression tests

Run tests with:

```bash
npm test
```

## Related Documentation

- [Skill Schema](../../schemas/skill.schema.json)
- [Skills Directory](../../skills/)
- [Project README](../../README.md)
