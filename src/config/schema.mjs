import { z } from 'zod';

// --- Legacy Schema (for river run) ---
export const modelConfigSchema = z.object({
  provider: z.enum(['google', 'openai', 'anthropic']).optional(),
  modelName: z.string().min(1).optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().optional(),
});

export const reviewConfigSchema = z.object({
  language: z.enum(['ja', 'en']).optional(),
  severity: z.enum(['strict', 'normal', 'relaxed']).optional(),
  additionalInstructions: z.array(z.string().min(1)).optional(),
});

export const excludeConfigSchema = z.object({
  files: z.array(z.string().min(1)).optional(),
  prLabelsToIgnore: z.array(z.string().min(1)).optional(),
});

// --- #692 PR-B: security.redact.* schema ---
//
// Pure schema addition: this PR only teaches the loader to accept and
// validate `security.redact.*`. The keys are not yet read by the review
// pipeline; PR-C of #692 will plumb `config.security` into
// src/lib/repo-context.mjs and src/lib/local-runner.mjs.
//
// Default policy: redaction enabled; every named category on; entropy
// fallback at 4.5 bits/char with a 24-char minimum length. Users tighten
// or loosen via `extraPatterns`, `allowlist`, and `denyFiles`.

export const redactCategoriesSchema = z
  .object({
    githubToken: z.boolean().optional(),
    openaiKey: z.boolean().optional(),
    anthropicKey: z.boolean().optional(),
    googleApiKey: z.boolean().optional(),
    awsAccessKey: z.boolean().optional(),
    awsSecretKey: z.boolean().optional(),
    privateKey: z.boolean().optional(),
    bearerToken: z.boolean().optional(),
    databaseUrl: z.boolean().optional(),
    webhookUrl: z.boolean().optional(),
    oauthSecret: z.boolean().optional(),
    envAssignment: z.boolean().optional(),
    highEntropy: z.boolean().optional(),
  })
  .strict();

export const redactExtraPatternSchema = z
  .object({
    id: z.string().min(1),
    pattern: z.string().min(1),
    replacement: z.string().min(1).optional(),
  })
  .strict();

export const redactConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    categories: redactCategoriesSchema.optional(),
    extraPatterns: z.array(redactExtraPatternSchema).optional(),
    allowlist: z.array(z.string().min(1)).optional(),
    denyFiles: z.array(z.string().min(1)).optional(),
    entropyThreshold: z.number().min(3.0).max(6.0).optional(),
    entropyMinLength: z.number().int().min(8).optional(),
  })
  .strict();

export const securityConfigSchema = z
  .object({
    redact: redactConfigSchema.optional(),
  })
  .strict();

export const riverReviewerConfigSchema = z.object({
  model: modelConfigSchema.optional(),
  review: reviewConfigSchema.optional(),
  exclude: excludeConfigSchema.optional(),
  security: securityConfigSchema.optional(),
});

// --- New Skill-based Schema (for river skills) ---

// Skill-based schemas
export const AIModelSchema = z.enum([
  'gemini-2.0-flash', // Default: Fast & Smart
  'gemini-2.0-flash-thinking', // Reasoning: For Security/Architecture
  'gemini-2.0-pro', // High Spec
  'gemini-1.5-pro', // Legacy Balanced
  'gpt-4o', // OpenAI Option
  'o1', // OpenAI Reasoning
  'o1-mini', // OpenAI Fast Reasoning
]);

export const RuleSchema = z.object({
  id: z.string().describe('Unique identifier for the rule'),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  description: z.string(),
  context: z.string().describe('Why this matters (Understanding)'),
  patterns: z.array(z.string()).describe('Keywords or patterns to look for'),
  anti_patterns: z.array(z.string()).describe('Bad code examples'),
  fix_guidance: z.string().describe('How to fix it (Expertise Transfer)'),
});

export const SkillSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  files: z.array(z.string()).describe('Glob patterns for target files'),
  exclude: z.array(z.string()).optional(),
  model: AIModelSchema.default('gemini-2.0-flash'),
  temperature: z.number().min(0).max(1).default(0.2),
  rules: z.array(RuleSchema),
});

export const ConfigSchema = z
  .object({
    version: z.string().default('1.0'),
    model: modelConfigSchema.optional(),
    review: reviewConfigSchema.optional(),
    exclude: excludeConfigSchema.optional(),
    security: securityConfigSchema.optional(),
    skills: z.array(SkillSchema).default([]),
  })
  // Allow forward-compatible / custom keys; unknown detection is handled in loader for warnings
  .catchall(z.unknown());
