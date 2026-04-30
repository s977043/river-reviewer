import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import {
  modelConfigSchema,
  reviewConfigSchema,
  excludeConfigSchema,
  riverReviewerConfigSchema,
  AIModelSchema,
  RuleSchema,
  SkillSchema,
  ConfigSchema,
  redactCategoriesSchema,
  redactConfigSchema,
  securityConfigSchema,
} from '../src/config/schema.mjs';

import { RiskActionSchema, RiskRuleSchema, RiskMapSchema } from '../src/config/risk-map-schema.mjs';

// ---------------------------------------------------------------------------
// Legacy schemas (river run)
// ---------------------------------------------------------------------------

describe('modelConfigSchema', () => {
  test('accepts valid config', () => {
    const result = modelConfigSchema.safeParse({
      provider: 'openai',
      modelName: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 1024,
    });
    assert.ok(result.success);
  });

  test('accepts empty object (all optional)', () => {
    assert.ok(modelConfigSchema.safeParse({}).success);
  });

  test('rejects invalid provider', () => {
    const result = modelConfigSchema.safeParse({ provider: 'azure' });
    assert.ok(!result.success);
  });

  test('rejects temperature out of range', () => {
    assert.ok(!modelConfigSchema.safeParse({ temperature: 2 }).success);
    assert.ok(!modelConfigSchema.safeParse({ temperature: -0.1 }).success);
  });

  test('rejects non-positive maxTokens', () => {
    assert.ok(!modelConfigSchema.safeParse({ maxTokens: 0 }).success);
    assert.ok(!modelConfigSchema.safeParse({ maxTokens: -10 }).success);
  });
});

describe('reviewConfigSchema', () => {
  test('accepts valid config', () => {
    const result = reviewConfigSchema.safeParse({
      language: 'ja',
      severity: 'strict',
      additionalInstructions: ['Be thorough'],
    });
    assert.ok(result.success);
  });

  test('rejects invalid language', () => {
    assert.ok(!reviewConfigSchema.safeParse({ language: 'fr' }).success);
  });

  test('rejects invalid severity', () => {
    assert.ok(!reviewConfigSchema.safeParse({ severity: 'harsh' }).success);
  });

  test('rejects empty strings in additionalInstructions', () => {
    assert.ok(!reviewConfigSchema.safeParse({ additionalInstructions: [''] }).success);
  });
});

describe('excludeConfigSchema', () => {
  test('accepts valid exclusions', () => {
    const result = excludeConfigSchema.safeParse({
      files: ['*.md', 'vendor/**'],
      prLabelsToIgnore: ['skip-review'],
    });
    assert.ok(result.success);
  });

  test('rejects empty strings in arrays', () => {
    assert.ok(!excludeConfigSchema.safeParse({ files: [''] }).success);
  });
});

describe('riverReviewerConfigSchema', () => {
  test('accepts combined config', () => {
    const result = riverReviewerConfigSchema.safeParse({
      model: { provider: 'google' },
      review: { language: 'en' },
      exclude: { files: ['*.lock'] },
    });
    assert.ok(result.success);
  });

  test('accepts empty object', () => {
    assert.ok(riverReviewerConfigSchema.safeParse({}).success);
  });

  test('accepts security.redact block (#692 PR-B)', () => {
    const result = riverReviewerConfigSchema.safeParse({
      security: {
        redact: {
          enabled: true,
          categories: { githubToken: true, highEntropy: false },
          extraPatterns: [{ id: 'custom', pattern: '\\bsecret-\\w+\\b' }],
          allowlist: ['TESTFIXTURE'],
          denyFiles: ['vendor/**'],
          entropyThreshold: 4.5,
          entropyMinLength: 24,
        },
      },
    });
    assert.ok(result.success, JSON.stringify(result.error?.format()));
  });
});

// ---------------------------------------------------------------------------
// #692 PR-B: security.redact.* zod and JSON Schema
// ---------------------------------------------------------------------------

describe('redactCategoriesSchema', () => {
  test('accepts a partial object with only some categories', () => {
    const r = redactCategoriesSchema.safeParse({ githubToken: true, highEntropy: false });
    assert.ok(r.success);
  });

  test('rejects unknown category keys (strict)', () => {
    const r = redactCategoriesSchema.safeParse({ unknownThing: true });
    assert.equal(r.success, false);
  });

  test('rejects non-boolean values', () => {
    const r = redactCategoriesSchema.safeParse({ githubToken: 'yes' });
    assert.equal(r.success, false);
  });
});

describe('redactConfigSchema', () => {
  test('accepts an empty object (everything optional)', () => {
    assert.ok(redactConfigSchema.safeParse({}).success);
  });

  test('rejects entropyThreshold outside [3.0, 6.0]', () => {
    assert.equal(redactConfigSchema.safeParse({ entropyThreshold: 2.9 }).success, false);
    assert.equal(redactConfigSchema.safeParse({ entropyThreshold: 6.1 }).success, false);
    assert.ok(redactConfigSchema.safeParse({ entropyThreshold: 4.5 }).success);
  });

  test('rejects non-integer entropyMinLength', () => {
    assert.equal(redactConfigSchema.safeParse({ entropyMinLength: 24.5 }).success, false);
    assert.equal(redactConfigSchema.safeParse({ entropyMinLength: 7 }).success, false);
    assert.ok(redactConfigSchema.safeParse({ entropyMinLength: 24 }).success);
  });

  test('rejects extra properties (strict)', () => {
    const r = redactConfigSchema.safeParse({ enabled: true, somethingElse: 1 });
    assert.equal(r.success, false);
  });

  test('rejects extraPatterns entries that omit id or pattern', () => {
    assert.equal(
      redactConfigSchema.safeParse({ extraPatterns: [{ pattern: 'x' }] }).success,
      false
    );
    assert.equal(redactConfigSchema.safeParse({ extraPatterns: [{ id: 'x' }] }).success, false);
  });
});

describe('securityConfigSchema', () => {
  test('accepts only `redact`', () => {
    assert.ok(securityConfigSchema.safeParse({ redact: { enabled: false } }).success);
  });

  test('rejects unknown top-level keys (strict)', () => {
    assert.equal(securityConfigSchema.safeParse({ network: {} }).success, false);
  });
});

describe('redaction-config.schema.json (#692 PR-B)', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const schemaPath = resolve(__dirname, '..', 'schemas', 'redaction-config.schema.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  test('accepts an example matching all properties', () => {
    const ok = validate({
      enabled: true,
      categories: { githubToken: true },
      extraPatterns: [{ id: 'custom', pattern: '\\bX\\b', replacement: '<X>' }],
      allowlist: ['TESTFIXTURE'],
      denyFiles: ['vendor/**'],
      entropyThreshold: 4.5,
      entropyMinLength: 24,
    });
    assert.ok(ok, JSON.stringify(validate.errors));
  });

  test('rejects unknown root-level properties', () => {
    const ok = validate({ enabled: true, somethingElse: 1 });
    assert.equal(ok, false);
  });

  test('rejects extraPatterns entries missing required fields', () => {
    assert.equal(validate({ extraPatterns: [{ pattern: 'x' }] }), false);
    assert.equal(validate({ extraPatterns: [{ id: 'x' }] }), false);
  });

  test('rejects out-of-range entropyThreshold', () => {
    assert.equal(validate({ entropyThreshold: 2.5 }), false);
    assert.equal(validate({ entropyThreshold: 6.5 }), false);
  });
});

// ---------------------------------------------------------------------------
// Skill-based schemas
// ---------------------------------------------------------------------------

describe('AIModelSchema', () => {
  test('accepts known models', () => {
    for (const model of ['gemini-2.0-flash', 'gpt-4o', 'o1', 'o1-mini']) {
      assert.ok(AIModelSchema.safeParse(model).success, `should accept ${model}`);
    }
  });

  test('rejects unknown models', () => {
    assert.ok(!AIModelSchema.safeParse('claude-3').success);
  });
});

describe('RuleSchema', () => {
  test('accepts valid rule', () => {
    const result = RuleSchema.safeParse({
      id: 'rule-1',
      severity: 'error',
      description: 'Desc',
      context: 'Why',
      patterns: ['TODO'],
      anti_patterns: ['bad code'],
      fix_guidance: 'Fix it',
    });
    assert.ok(result.success);
  });

  test('rejects missing required fields', () => {
    assert.ok(!RuleSchema.safeParse({ id: 'rule-1' }).success);
  });
});

describe('ConfigSchema', () => {
  test('accepts minimal config with defaults', () => {
    const result = ConfigSchema.safeParse({});
    assert.ok(result.success);
    assert.equal(result.data.version, '1.0');
    assert.deepEqual(result.data.skills, []);
  });

  test('allows unknown keys (catchall)', () => {
    const result = ConfigSchema.safeParse({ customField: 'value' });
    assert.ok(result.success);
    assert.equal(result.data.customField, 'value');
  });
});

// ---------------------------------------------------------------------------
// Risk map schemas
// ---------------------------------------------------------------------------

describe('RiskActionSchema', () => {
  test('accepts valid actions', () => {
    for (const action of ['comment_only', 'escalate', 'require_human_review']) {
      assert.ok(RiskActionSchema.safeParse(action).success);
    }
  });

  test('rejects invalid action', () => {
    assert.ok(!RiskActionSchema.safeParse('block').success);
  });
});

describe('RiskRuleSchema', () => {
  test('accepts valid rule', () => {
    const result = RiskRuleSchema.safeParse({
      pattern: 'src/auth/**',
      action: 'escalate',
      reason: 'Auth changes are sensitive',
    });
    assert.ok(result.success);
  });

  test('rejects empty pattern', () => {
    assert.ok(!RiskRuleSchema.safeParse({ pattern: '', action: 'escalate' }).success);
  });

  test('reason is optional', () => {
    assert.ok(RiskRuleSchema.safeParse({ pattern: '*.ts', action: 'comment_only' }).success);
  });
});

describe('RiskMapSchema', () => {
  test('accepts valid risk map', () => {
    const result = RiskMapSchema.safeParse({
      version: '1',
      rules: [{ pattern: 'db/**', action: 'require_human_review' }],
    });
    assert.ok(result.success);
    assert.equal(result.data.defaults.action, 'comment_only');
  });

  test('rejects empty rules array', () => {
    assert.ok(!RiskMapSchema.safeParse({ rules: [] }).success);
  });

  test('applies default version and defaults.action', () => {
    const result = RiskMapSchema.safeParse({
      rules: [{ pattern: '**/*.ts', action: 'escalate' }],
    });
    assert.ok(result.success);
    assert.equal(result.data.version, '1');
    assert.equal(result.data.defaults.action, 'comment_only');
  });

  test('allows overriding defaults.action', () => {
    const result = RiskMapSchema.safeParse({
      rules: [{ pattern: '**', action: 'comment_only' }],
      defaults: { action: 'escalate' },
    });
    assert.ok(result.success);
    assert.equal(result.data.defaults.action, 'escalate');
  });
});
