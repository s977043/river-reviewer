/**
 * River Reviewer Node.js API
 *
 * Programmatic interface for using River Reviewer in custom Node.js applications.
 *
 * @example
 * ```typescript
 * import { review, loadSkills } from '@river-reviewer/node-api';
 *
 * // Review files
 * const results = await review({
 *   phase: 'midstream',
 *   files: ['src/**\/*.ts'],
 *   baseBranch: 'main',
 * });
 *
 * // Load skills
 * const skills = await loadSkills({
 *   skillsDir: './skills',
 *   phase: 'midstream',
 * });
 * ```
 *
 * @module @river-reviewer/node-api
 */

import {
  loadSkills as coreLoadSkills,
  loadSkillFile as coreLoadSkillFile,
  defaultPaths,
  SkillLoaderError,
} from '@river-reviewer/core-runner/skill-loader';
import {
  buildExecutionPlan as coreBuildExecutionPlan,
  selectSkills as coreSelectSkills,
  matchesPhase as coreMatchesPhase,
  rankByModelHint as coreRankByModelHint,
  summarizeSkill as coreSummarizeSkill,
} from '@river-reviewer/core-runner/review-runner';

// Re-export all types
export type {
  Phase,
  Severity,
  InputContext,
  OutputKind,
  ModelHint,
  Dependency,
  SkillMetadata,
  SkillDefinition,
  LoadSkillsOptions,
  ReviewOptions,
  SkillSelectionResult,
  Finding,
  ReviewSummary,
  ReviewMetadata,
  ReviewResult,
  EvaluateSkillOptions,
  EvaluationResult,
} from './types.js';

import type {
  LoadSkillsOptions,
  ReviewOptions,
  SkillSelectionResult,
  ReviewResult,
  EvaluateSkillOptions,
  EvaluationResult,
  SkillDefinition,
  Phase,
  InputContext,
  Dependency,
  ModelHint,
} from './types.js';

/**
 * Load all skills from the skills directory.
 *
 * This function discovers and loads all skill definitions, validating them
 * against the skill schema. Skills can be filtered by phase if specified.
 *
 * @param options - Options for loading skills
 * @returns Promise resolving to array of skill definitions
 *
 * @example
 * ```typescript
 * // Load all skills
 * const allSkills = await loadSkills();
 *
 * // Load skills from custom directory
 * const customSkills = await loadSkills({
 *   skillsDir: '/path/to/skills',
 * });
 *
 * // Load skills for specific phase
 * const midstreamSkills = await loadSkills({
 *   phase: 'midstream',
 * });
 * ```
 */
export async function loadSkills(options: LoadSkillsOptions = {}): Promise<SkillDefinition[]> {
  const { skillsDir, schemaPath, phase } = options;

  const skills = await coreLoadSkills({
    skillsDir,
    schemaPath,
  });

  // Filter by phase if specified
  if (phase) {
    return skills.filter((skill) => coreMatchesPhase(skill, phase));
  }

  return skills;
}

/**
 * Load a single skill file.
 *
 * @param filePath - Absolute path to the skill file
 * @param options - Optional loading options
 * @returns Promise resolving to skill definition
 *
 * @example
 * ```typescript
 * const skill = await loadSkillFile('/path/to/skill.md');
 * console.log(skill.metadata.id);
 * ```
 */
export async function loadSkillFile(
  filePath: string,
  options: Pick<LoadSkillsOptions, 'schemaPath'> = {}
): Promise<SkillDefinition> {
  return coreLoadSkillFile(filePath, options);
}

/**
 * Select skills based on review context.
 *
 * This function filters skills based on phase, file patterns, available contexts,
 * and dependencies. It returns both selected skills and skipped skills with reasons.
 *
 * @param skills - Array of skill definitions to filter
 * @param options - Review context options
 * @returns Skill selection result with selected and skipped skills
 *
 * @example
 * ```typescript
 * const skills = await loadSkills();
 * const selection = selectSkills(skills, {
 *   phase: 'midstream',
 *   changedFiles: ['src/app.ts', 'src/utils.ts'],
 *   availableContexts: ['diff', 'fullFile'],
 * });
 *
 * console.log(`Selected: ${selection.selected.length}`);
 * console.log(`Skipped: ${selection.skipped.length}`);
 * ```
 */
export function selectSkills(
  skills: SkillDefinition[],
  options: {
    phase: Phase;
    changedFiles: string[];
    availableContexts?: InputContext[];
    availableDependencies?: Dependency[];
  }
): {
  selected: SkillDefinition[];
  skipped: Array<{ skill: SkillDefinition; reasons: string[] }>;
} {
  return coreSelectSkills(skills, {
    phase: options.phase,
    changedFiles: options.changedFiles,
    availableContexts: options.availableContexts ?? [],
    availableDependencies: options.availableDependencies,
  });
}

/**
 * Build an execution plan for skill execution.
 *
 * This function creates an optimized execution plan by selecting relevant skills,
 * ranking them by impact tags and model hints, and optionally using an LLM planner
 * for intelligent prioritization.
 *
 * @param options - Execution plan options
 * @returns Promise resolving to skill selection result with execution plan
 *
 * @example
 * ```typescript
 * const plan = await buildExecutionPlan({
 *   phase: 'midstream',
 *   changedFiles: ['src/app.ts'],
 *   availableContexts: ['diff', 'fullFile'],
 *   preferredModelHint: 'balanced',
 *   diffText: '... git diff output ...',
 * });
 *
 * for (const skill of plan.selected) {
 *   console.log(`Execute: ${skill.metadata.id}`);
 * }
 * ```
 */
export async function buildExecutionPlan(options: {
  phase: Phase;
  changedFiles: string[];
  availableContexts?: InputContext[];
  availableDependencies?: Dependency[];
  preferredModelHint?: ModelHint;
  skills?: SkillDefinition[];
  diffText?: string;
}): Promise<SkillSelectionResult> {
  const result = await coreBuildExecutionPlan({
    phase: options.phase,
    changedFiles: options.changedFiles,
    availableContexts: options.availableContexts ?? [],
    availableDependencies: options.availableDependencies,
    preferredModelHint: options.preferredModelHint ?? 'balanced',
    skills: options.skills,
    diffText: options.diffText,
  });

  return result as SkillSelectionResult;
}

/**
 * Review files using River Reviewer skills.
 *
 * This is the main entry point for programmatic code review. It loads skills,
 * builds an execution plan, and returns a structured result.
 *
 * Note: This function currently returns the execution plan. Actual skill execution
 * requires integration with an AI provider, which should be implemented by the caller.
 *
 * @param options - Review options
 * @returns Promise resolving to review result
 *
 * @example
 * ```typescript
 * const result = await review({
 *   phase: 'midstream',
 *   files: ['src/**\/*.ts'],
 *   availableContexts: ['diff', 'fullFile'],
 *   preferredModelHint: 'balanced',
 * });
 *
 * console.log(`Found ${result.summary.totalFindings} findings`);
 * ```
 */
export async function review(options: ReviewOptions): Promise<ReviewResult> {
  const {
    phase = 'midstream',
    files = [],
    skillsDir,
    availableContexts = ['diff', 'fullFile'],
    availableDependencies,
    preferredModelHint = 'balanced',
    diffText,
  } = options;

  // Load skills
  const skills = await loadSkills({ skillsDir, phase });

  // Build execution plan
  const plan = await buildExecutionPlan({
    phase,
    changedFiles: files,
    availableContexts,
    availableDependencies,
    preferredModelHint,
    skills,
    diffText,
  });

  // TODO: Actual skill execution would happen here with AI provider integration
  // For now, return a structured result with the execution plan

  const result: ReviewResult = {
    findings: [],
    summary: {
      totalFindings: 0,
      bySeverity: {
        critical: 0,
        major: 0,
        minor: 0,
        info: 0,
      },
      filesReviewed: files.length,
      skillsExecuted: plan.selected.length,
    },
    metadata: {
      phase,
      files,
      timestamp: new Date().toISOString(),
      skillsExecuted: plan.selected.map((s) => s.metadata.id),
      skillsSkipped: plan.skipped.map((s) => s.skill.metadata.id),
    },
  };

  return result;
}

/**
 * Evaluate a specific skill with an AI provider.
 *
 * This function is a placeholder for skill evaluation functionality.
 * Actual implementation requires AI provider integration.
 *
 * @param options - Evaluation options
 * @returns Promise resolving to evaluation result
 *
 * @example
 * ```typescript
 * const result = await evaluateSkill({
 *   skillId: 'rr-midstream-security-basic-001',
 *   provider: 'openai:gpt-4o',
 *   files: ['src/app.ts'],
 * });
 *
 * if (result.success) {
 *   console.log(`Found ${result.findings?.length} findings`);
 * }
 * ```
 */
export async function evaluateSkill(options: EvaluateSkillOptions): Promise<EvaluationResult> {
  const {
    skillId,
    provider: _provider,
    files: _files = [],
    inputContexts: _inputContexts = [],
    skillsDir,
  } = options;

  const startTime = Date.now();

  try {
    // Load all skills and find the target skill
    const skills = await loadSkills({ skillsDir });
    const skill = skills.find((s) => s.metadata.id === skillId);

    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    // TODO: Implement actual AI provider integration
    // This would involve:
    // 1. Initializing the AI provider client based on the provider string
    // 2. Preparing the context (files, diff, etc.)
    // 3. Executing the skill with the AI provider
    // 4. Parsing the results into findings

    const executionTime = Date.now() - startTime;

    return {
      skill,
      success: false,
      error: 'AI provider integration not yet implemented',
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      skill: {} as SkillDefinition, // Placeholder
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime,
    };
  }
}

/**
 * Get default paths used by River Reviewer.
 *
 * @returns Object containing default paths for repository root, skills directory, and schema
 *
 * @example
 * ```typescript
 * const paths = getDefaultPaths();
 * console.log(`Skills directory: ${paths.skillsDir}`);
 * ```
 */
export function getDefaultPaths(): {
  repoRoot: string;
  skillsDir: string;
  schemaPath: string;
} {
  return defaultPaths;
}

/**
 * Check if a skill matches a specific phase.
 *
 * @param skill - Skill definition or metadata
 * @param phase - Phase to check
 * @returns True if skill matches the phase
 *
 * @example
 * ```typescript
 * const skill = await loadSkillFile('/path/to/skill.md');
 * if (matchesPhase(skill, 'midstream')) {
 *   console.log('Skill applies to midstream phase');
 * }
 * ```
 */
export function matchesPhase(
  skill: SkillDefinition | SkillDefinition['metadata'],
  phase: Phase
): boolean {
  return coreMatchesPhase(skill, phase);
}

/**
 * Rank skills by model hint preference.
 *
 * @param skills - Skills to rank
 * @param preferredModelHint - Preferred model hint
 * @returns Ranked skills
 *
 * @example
 * ```typescript
 * const skills = await loadSkills();
 * const ranked = rankByModelHint(skills, 'balanced');
 * ```
 */
export function rankByModelHint(
  skills: SkillDefinition[],
  preferredModelHint: ModelHint = 'balanced'
): SkillDefinition[] {
  return coreRankByModelHint(skills, preferredModelHint);
}

/**
 * Summarize a skill for display or planning.
 *
 * @param skill - Skill definition to summarize
 * @returns Skill summary object
 *
 * @example
 * ```typescript
 * const skill = await loadSkillFile('/path/to/skill.md');
 * const summary = summarizeSkill(skill);
 * console.log(summary);
 * ```
 */
export function summarizeSkill(skill: SkillDefinition): {
  id: string;
  name: string;
  description: string;
  phase: Phase | Phase[];
  tags?: string[];
} {
  return coreSummarizeSkill(skill);
}

// Re-export SkillLoaderError for error handling
export { SkillLoaderError };
