# Node.js API Runner

Node.js API interface for programmatic usage of River Reviewer in custom applications.

## Overview

The Node API runner provides a TypeScript/JavaScript API for integrating River Reviewer into your Node.js applications. It enables programmatic skill loading, file review, and execution planning without requiring the CLI.

## Installation

```bash
npm install @river-reviewer/node-api
```

## Quick Start

```typescript
import { review, loadSkills, buildExecutionPlan } from '@river-reviewer/node-api';

// Review files programmatically
const results = await review({
  phase: 'midstream',
  files: ['src/**/*.ts'],
  availableContexts: ['diff', 'fullFile'],
});

console.log(`Found ${results.summary.totalFindings} findings`);
console.log(`Executed ${results.summary.skillsExecuted} skills`);
```

## API Reference

### Core Functions

#### `loadSkills(options?)`

Load all skills from the skills directory with optional filtering.

**Parameters:**

- `options.skillsDir?: string` - Custom skills directory path
- `options.schemaPath?: string` - Custom schema path
- `options.phase?: Phase` - Filter skills by phase

**Returns:** `Promise<SkillDefinition[]>`

**Example:**

```typescript
// Load all skills
const allSkills = await loadSkills();

// Load skills for specific phase
const midstreamSkills = await loadSkills({ phase: 'midstream' });

// Load from custom directory
const customSkills = await loadSkills({
  skillsDir: '/path/to/skills',
});
```

#### `loadSkillFile(filePath, options?)`

Load a single skill file.

**Parameters:**

- `filePath: string` - Absolute path to skill file
- `options.schemaPath?: string` - Optional schema path

**Returns:** `Promise<SkillDefinition>`

**Example:**

```typescript
const skill = await loadSkillFile('/path/to/skill.md');
console.log(skill.metadata.id);
console.log(skill.metadata.name);
```

#### `selectSkills(skills, options)`

Select skills matching review context criteria.

**Parameters:**

- `skills: SkillDefinition[]` - Array of skills to filter
- `options.phase: Phase` - Review phase
- `options.changedFiles: string[]` - Changed file paths
- `options.availableContexts?: InputContext[]` - Available contexts
- `options.availableDependencies?: Dependency[]` - Available dependencies

**Returns:** `{ selected: SkillDefinition[], skipped: Array<{ skill, reasons }> }`

**Example:**

```typescript
const skills = await loadSkills();
const selection = selectSkills(skills, {
  phase: 'midstream',
  changedFiles: ['src/app.ts', 'src/utils.ts'],
  availableContexts: ['diff', 'fullFile'],
});

console.log(`Selected ${selection.selected.length} skills`);
selection.skipped.forEach(({ skill, reasons }) => {
  console.log(`Skipped ${skill.metadata.id}: ${reasons.join(', ')}`);
});
```

#### `buildExecutionPlan(options)`

Build an optimized execution plan with skill prioritization.

**Parameters:**

- `options.phase: Phase` - Review phase
- `options.changedFiles: string[]` - Changed file paths
- `options.availableContexts?: InputContext[]` - Available contexts
- `options.availableDependencies?: Dependency[]` - Available dependencies
- `options.preferredModelHint?: ModelHint` - Preferred model hint (default: 'balanced')
- `options.skills?: SkillDefinition[]` - Pre-loaded skills (optional)
- `options.diffText?: string` - Git diff text for impact analysis

**Returns:** `Promise<SkillSelectionResult>`

**Example:**

```typescript
const plan = await buildExecutionPlan({
  phase: 'midstream',
  changedFiles: ['src/app.ts'],
  availableContexts: ['diff', 'fullFile'],
  preferredModelHint: 'balanced',
  diffText: diffOutput,
});

// Execute skills in priority order
for (const skill of plan.selected) {
  console.log(`Execute: ${skill.metadata.id}`);
  // Custom execution logic here
}
```

#### `review(options)`

Main entry point for programmatic file review.

**Parameters:**

- `options.phase?: Phase` - Review phase (default: 'midstream')
- `options.files?: string[]` - File patterns or paths to review
- `options.baseBranch?: string` - Base branch for diff comparison
- `options.skillsDir?: string` - Custom skills directory
- `options.availableContexts?: InputContext[]` - Available contexts
- `options.availableDependencies?: Dependency[]` - Available dependencies
- `options.preferredModelHint?: ModelHint` - Preferred model hint
- `options.diffText?: string` - Git diff text

**Returns:** `Promise<ReviewResult>`

**Example:**

```typescript
const result = await review({
  phase: 'midstream',
  files: ['src/**/*.ts'],
  availableContexts: ['diff', 'fullFile'],
  preferredModelHint: 'balanced',
});

console.log(`Total findings: ${result.summary.totalFindings}`);
console.log(`Critical: ${result.summary.bySeverity.critical}`);
console.log(`Major: ${result.summary.bySeverity.major}`);
console.log(`Files reviewed: ${result.summary.filesReviewed}`);
```

#### `evaluateSkill(options)`

Evaluate a specific skill (placeholder for AI integration).

**Parameters:**

- `options.skillId: string` - Skill ID to evaluate
- `options.provider: string` - AI provider (e.g., "openai:gpt-4o")
- `options.files?: string[]` - Files to evaluate
- `options.inputContexts?: InputContext[]` - Input contexts
- `options.skillsDir?: string` - Custom skills directory

**Returns:** `Promise<EvaluationResult>`

**Example:**

```typescript
const result = await evaluateSkill({
  skillId: 'rr-midstream-security-basic-001',
  provider: 'openai:gpt-4o',
  files: ['src/app.ts'],
});

if (result.success) {
  console.log(`Execution time: ${result.executionTime}ms`);
}
```

### Utility Functions

#### `getDefaultPaths()`

Get default paths for River Reviewer.

**Returns:** `{ repoRoot: string, skillsDir: string, schemaPath: string }`

```typescript
const paths = getDefaultPaths();
console.log(`Skills directory: ${paths.skillsDir}`);
```

#### `matchesPhase(skill, phase)`

Check if a skill matches a specific phase.

**Parameters:**

- `skill: SkillDefinition | SkillMetadata` - Skill to check
- `phase: Phase` - Phase to match

**Returns:** `boolean`

```typescript
const skill = await loadSkillFile('/path/to/skill.md');
if (matchesPhase(skill, 'midstream')) {
  console.log('Skill applies to midstream');
}
```

#### `rankByModelHint(skills, preferredModelHint?)`

Rank skills by model hint preference.

**Parameters:**

- `skills: SkillDefinition[]` - Skills to rank
- `preferredModelHint?: ModelHint` - Preferred hint (default: 'balanced')

**Returns:** `SkillDefinition[]`

```typescript
const skills = await loadSkills();
const ranked = rankByModelHint(skills, 'high-accuracy');
```

#### `summarizeSkill(skill)`

Create a summary of skill metadata.

**Parameters:**

- `skill: SkillDefinition` - Skill to summarize

**Returns:** `{ id, name, description, phase, tags? }`

```typescript
const skill = await loadSkillFile('/path/to/skill.md');
const summary = summarizeSkill(skill);
console.log(summary);
```

## Type Definitions

### Core Types

```typescript
type Phase = 'upstream' | 'midstream' | 'downstream';
type Severity = 'info' | 'minor' | 'major' | 'critical';
type InputContext = 'diff' | 'fullFile' | 'tests' | 'adr' | 'commitMessage' | 'repoConfig';
type OutputKind = 'findings' | 'summary' | 'actions' | 'tests' | 'metrics' | 'questions';
type ModelHint = 'cheap' | 'balanced' | 'high-accuracy';
type Dependency =
  | 'code_search'
  | 'test_runner'
  | 'adr_lookup'
  | 'repo_metadata'
  | 'coverage_report'
  | 'tracing'
  | `custom:${string}`;
```

### Interfaces

See [src/types.ts](./src/types.ts) for complete type definitions including:

- `SkillMetadata` - Skill metadata structure
- `SkillDefinition` - Complete skill with body and path
- `ReviewOptions` - Options for review function
- `ReviewResult` - Review execution result
- `Finding` - Individual finding structure
- `ReviewSummary` - Summary statistics
- `EvaluationResult` - Skill evaluation result

## Usage Examples

### Basic File Review

```typescript
import { review } from '@river-reviewer/node-api';

async function reviewChanges() {
  const result = await review({
    phase: 'midstream',
    files: ['src/**/*.ts'],
    availableContexts: ['diff', 'fullFile'],
  });

  console.log(`Review complete:`);
  console.log(`- Total findings: ${result.summary.totalFindings}`);
  console.log(`- Skills executed: ${result.summary.skillsExecuted}`);
  console.log(`- Files reviewed: ${result.summary.filesReviewed}`);
}
```

### Custom Skill Loading and Filtering

```typescript
import { loadSkills, selectSkills } from '@river-reviewer/node-api';

async function customReview() {
  // Load all midstream skills
  const skills = await loadSkills({ phase: 'midstream' });

  // Filter for TypeScript files
  const selection = selectSkills(skills, {
    phase: 'midstream',
    changedFiles: ['src/app.ts', 'src/utils.ts'],
    availableContexts: ['diff', 'fullFile'],
  });

  console.log('Selected skills:');
  selection.selected.forEach((skill) => {
    console.log(`- ${skill.metadata.id}: ${skill.metadata.name}`);
  });

  console.log('\nSkipped skills:');
  selection.skipped.forEach(({ skill, reasons }) => {
    console.log(`- ${skill.metadata.id}: ${reasons.join(', ')}`);
  });
}
```

### Execution Planning with Impact Analysis

```typescript
import { buildExecutionPlan } from '@river-reviewer/node-api';
import { execSync } from 'child_process';

async function planReview() {
  // Get git diff
  const diffText = execSync('git diff main', { encoding: 'utf8' });

  // Build execution plan
  const plan = await buildExecutionPlan({
    phase: 'midstream',
    changedFiles: ['src/security.ts', 'src/auth.ts'],
    availableContexts: ['diff', 'fullFile'],
    preferredModelHint: 'balanced',
    diffText,
  });

  console.log('Execution plan:');
  console.log(`- Impact tags: ${plan.impactTags?.join(', ')}`);
  console.log(`- Skills to execute: ${plan.selected.length}`);

  plan.selected.forEach((skill, index) => {
    console.log(`${index + 1}. ${skill.metadata.id} (${skill.metadata.modelHint})`);
  });
}
```

### Integration with Custom AI Provider

```typescript
import { loadSkills, buildExecutionPlan } from '@river-reviewer/node-api';
import type { SkillDefinition, Finding } from '@river-reviewer/node-api';

async function executeWithCustomProvider(
  skill: SkillDefinition,
  files: string[]
): Promise<Finding[]> {
  // Custom AI provider integration
  // This is where you would integrate with OpenAI, Anthropic, etc.
  const findings: Finding[] = [];
  // ... your implementation
  return findings;
}

async function customReviewWorkflow() {
  const plan = await buildExecutionPlan({
    phase: 'midstream',
    changedFiles: ['src/app.ts'],
    availableContexts: ['diff', 'fullFile'],
  });

  const allFindings: Finding[] = [];

  for (const skill of plan.selected) {
    const findings = await executeWithCustomProvider(skill, ['src/app.ts']);
    allFindings.push(...findings);
  }

  console.log(`Total findings: ${allFindings.length}`);
}
```

## Development

### Build

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory and generates type definition files.

### Clean

```bash
npm run clean
```

Remove the `dist/` directory.

## Architecture

The Node API runner is a thin wrapper around the core runner (`@river-reviewer/core-runner`) that provides:

1. **Type Safety**: Full TypeScript type definitions for all APIs
2. **Simplified Interface**: Clean, promise-based API surface
3. **Documentation**: Comprehensive JSDoc documentation
4. **Flexibility**: Support for custom skill directories, phases, and contexts

## Dependencies

- `@river-reviewer/core-runner` - Core skill loading and execution planning
- `js-yaml` - YAML parsing for skill definitions
- `minimatch` - Glob pattern matching for file routing

## Related Documentation

- [Core Runner](../core/README.md) - Core execution components
- [Skill Schema](../../schemas/skill.schema.json) - Skill definition schema
- [Skills Directory](../../skills/) - Available skills
- [Project README](../../README.md) - Main project documentation

## Notes

- The `review()` and `evaluateSkill()` functions currently return execution plans but do not execute skills with AI providers. Actual execution requires custom AI provider integration.
- For CLI usage, see the main `river-reviewer` CLI tool.
- This package uses ESM (ES Modules) format.

## License

MIT
