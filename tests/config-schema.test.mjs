import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  modelConfigSchema,
  reviewConfigSchema,
  excludeConfigSchema,
  riverReviewerConfigSchema,
  AIModelSchema,
  RuleSchema,
  SkillSchema,
  ConfigSchema,
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
