/**
 * Skill YAML Schema
 * Based on specs/skill-yaml-spec.md
 */

import { z } from 'zod';

// Enums
export const PhaseEnum = z.enum(['upstream', 'midstream', 'downstream']);
export const SeverityEnum = z.enum(['info', 'minor', 'major', 'critical']);
export const InputContextEnum = z.enum([
  'diff',
  'fullFile',
  'tests',
  'adr',
  'commitMessage',
  'repoConfig',
]);
export const OutputKindEnum = z.enum([
  'findings',
  'summary',
  'actions',
  'tests',
  'metrics',
  'questions',
]);
export const ModelHintEnum = z.enum(['cheap', 'balanced', 'high-accuracy']);

// Custom dependencies pattern
const DependencyEnum = z.enum([
  'code_search',
  'test_runner',
  'adr_lookup',
  'repo_metadata',
  'coverage_report',
  'tracing',
]);

const DependencySchema = z.union([DependencyEnum, z.string().startsWith('custom:')]);

// Prompt reference
const PromptSchema = z.object({
  system: z.string().min(1).describe('Path to system prompt file'),
  user: z.string().min(1).describe('Path to user prompt file'),
});

// Evaluation configuration
const EvalSchema = z.object({
  promptfoo: z.string().min(1).optional().describe('Path to promptfoo configuration'),
});

// Trigger configuration (alternative format)
const TriggerSchema = z.object({
  phase: z.union([PhaseEnum, z.array(PhaseEnum)]).describe('SDLC phase(s)'),
  files: z.array(z.string().min(1)).describe('File patterns (glob)'),
});

// Main Skill YAML Schema
export const SkillYamlSchema = z
  .object({
    // Required fields
    id: z.string().min(1).describe('Unique identifier for the skill'),
    version: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/, 'Must be semantic version format (x.y.z)')
      .describe('Semantic version'),
    name: z.string().min(1).describe('Human-readable skill name'),
    description: z.string().min(1).describe('Purpose and role of the skill'),

    // Trigger conditions (at top level or in trigger object)
    phase: z.union([PhaseEnum, z.array(PhaseEnum)]).optional().describe('SDLC phase(s)'),
    applyTo: z.array(z.string().min(1)).optional().describe('File patterns (glob)'),
    trigger: TriggerSchema.optional().describe('Alternative trigger format'),

    // Optional fields
    tags: z.array(z.string()).default([]).describe('Classification tags'),
    severity: SeverityEnum.default('minor').describe('Severity level of findings'),
    inputContext: z
      .array(InputContextEnum)
      .default(['diff'])
      .describe('Input context references'),
    outputKind: z
      .array(OutputKindEnum)
      .default(['findings', 'summary'])
      .describe('Output types'),
    modelHint: ModelHintEnum.default('balanced').describe('Recommended model type'),
    dependencies: z.array(DependencySchema).default([]).describe('Feature dependencies'),

    // Implementation references
    prompt: PromptSchema.optional().describe('Prompt file references'),

    // Evaluation settings
    eval: EvalSchema.optional().describe('Evaluation configuration'),

    // Test data
    fixturesDir: z.string().default('fixtures').describe('Fixtures directory path'),
    goldenDir: z.string().default('golden').describe('Golden directory path'),
  })
  .refine(
    (data) => {
      // Must have either top-level phase/applyTo or trigger object
      const hasTopLevel = data.phase !== undefined && data.applyTo !== undefined;
      const hasTrigger = data.trigger !== undefined;
      return hasTopLevel || hasTrigger;
    },
    {
      message:
        'Must have either (phase + applyTo) at top level or trigger object with phase and files',
    }
  );
