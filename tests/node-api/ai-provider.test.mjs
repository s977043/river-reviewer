import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import pure AI helpers (no @river-reviewer/core-runner dependency)
import { parseProvider, parseFindings } from '../../runners/node-api/dist/ai-helpers.js';

describe('parseProvider', () => {
  it('parses "openai:gpt-4o" correctly', () => {
    const result = parseProvider('openai:gpt-4o');
    assert.equal(result.type, 'openai');
    assert.equal(result.model, 'gpt-4o');
  });

  it('parses "openai:gpt-4o-mini" correctly', () => {
    const result = parseProvider('openai:gpt-4o-mini');
    assert.equal(result.type, 'openai');
    assert.equal(result.model, 'gpt-4o-mini');
  });

  it('uses gpt-4o as default model when no colon', () => {
    const result = parseProvider('openai');
    assert.equal(result.type, 'openai');
    assert.equal(result.model, 'gpt-4o');
  });

  it('parses anthropic provider', () => {
    const result = parseProvider('anthropic:claude-3-5-sonnet-20241022');
    assert.equal(result.type, 'anthropic');
    assert.equal(result.model, 'claude-3-5-sonnet-20241022');
  });
});

describe('parseFindings', () => {
  const sampleOutput = `
I found the following issues:

**Finding:** SQL injection vulnerability in user lookup query
**Evidence:** Line 13: db.query(\`SELECT * FROM users WHERE id = \${id}\`)
**Impact:** Attacker could execute arbitrary SQL commands
**Fix:** Use parameterized queries: db.query('SELECT * FROM users WHERE id = ?', [id])
**Severity:** major
**Confidence:** high

**Finding:** Missing input validation on API endpoint
**Evidence:** Line 42: const data = req.body
**Impact:** Unvalidated input may cause unexpected behavior
**Fix:** Add schema validation using zod or similar
**Severity:** minor
**Confidence:** medium
`;

  it('parses multiple findings from output', () => {
    const findings = parseFindings(sampleOutput, 'test-skill-001', ['src/api.ts']);
    assert.equal(findings.length, 2);
  });

  it('assigns skillId to each finding', () => {
    const findings = parseFindings(sampleOutput, 'test-skill-001', ['src/api.ts']);
    assert.ok(findings.every((f) => f.skillId === 'test-skill-001'));
  });

  it('assigns file from files array', () => {
    const findings = parseFindings(sampleOutput, 'test-skill-001', ['src/api.ts']);
    assert.ok(findings.every((f) => f.file === 'src/api.ts'));
  });

  it('uses "unknown" when no files provided', () => {
    const findings = parseFindings(sampleOutput, 'test-skill-001', []);
    assert.ok(findings.every((f) => f.file === 'unknown'));
  });

  it('parses severity correctly', () => {
    const findings = parseFindings(sampleOutput, 'test-skill-001', ['src/api.ts']);
    assert.equal(findings[0].severity, 'major');
    assert.equal(findings[1].severity, 'minor');
  });

  it('extracts line number from evidence when present', () => {
    const findings = parseFindings(sampleOutput, 'test-skill-001', ['src/api.ts']);
    assert.equal(findings[0].line, 13);
  });

  it('includes fix in suggestion', () => {
    const findings = parseFindings(sampleOutput, 'test-skill-001', ['src/api.ts']);
    assert.ok(findings[0].suggestion?.includes('parameterized'));
  });

  it('returns empty array for output with no findings', () => {
    const findings = parseFindings('No issues found.', 'test-skill-001', ['src/api.ts']);
    assert.equal(findings.length, 0);
  });

  it('falls back to "major" for unknown severity values', () => {
    const output = `
**Finding:** Some issue
**Evidence:** Line 5: foo()
**Impact:** Bad stuff
**Fix:** Fix it
**Severity:** blocker
**Confidence:** high
`;
    const findings = parseFindings(output, 'test-skill-001', ['src/api.ts']);
    assert.equal(findings[0].severity, 'major');
  });

  it('handles critical severity', () => {
    const output = `
**Finding:** Critical issue
**Evidence:** Line 1: code
**Impact:** Severe
**Fix:** Fix now
**Severity:** critical
**Confidence:** high
`;
    const findings = parseFindings(output, 'test-skill-001', ['src/api.ts']);
    assert.equal(findings[0].severity, 'critical');
  });
});
