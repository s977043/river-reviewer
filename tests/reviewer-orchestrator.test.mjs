import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Stub generateReview before importing the orchestrator
const generateReviewStub = mock.fn(async ({ projectRules }) => ({
  comments: [{ file: 'src/foo.mjs', line: 1, message: `Finding: issue Evidence: found in ${projectRules?.slice(0, 20) ?? ''}` }],
  findings: [
    {
      id: 'rr-1',
      ruleId: 'some-rule',
      file: 'src/foo.mjs',
      lineStart: 1,
      lineEnd: 1,
      title: 'test finding',
      message: 'Finding: issue Evidence: found in diff Impact: medium Fix: fix it Severity: major Confidence: high',
      severity: 'major',
      confidence: 'high',
      status: 'open',
      evidence: ['found in diff with enough characters to pass threshold here'],
    },
  ],
  classified: { overview: [], suppressed: [], inlineCandidates: [] },
  prompt: 'prompt text',
  promptTruncated: false,
  llmModel: 'gpt-4o',
  debug: {},
}));

// Patch the module before import via mock.module
const { runReviewerOrchestration, REVIEWER_ROLES, DEFAULT_REVIEWERS, resolveReviewerRoles } =
  await (() => {
    // We can't easily mock ESM imports in node:test without a loader.
    // Instead, import the real module and test its observable behaviour.
    return import('../src/lib/reviewer-orchestrator.mjs');
  })();

function makeDiff() {
  return { diffText: 'diff --git a/src/foo.mjs', files: [], filesForReview: [] };
}

describe('REVIEWER_ROLES', () => {
  it('exports bug-hunter, security-scanner, test-gap', () => {
    assert.ok('bug-hunter' in REVIEWER_ROLES);
    assert.ok('security-scanner' in REVIEWER_ROLES);
    assert.ok('test-gap' in REVIEWER_ROLES);
  });

  it('each role has label and focusInstructions', () => {
    for (const [, role] of Object.entries(REVIEWER_ROLES)) {
      assert.ok(typeof role.label === 'string' && role.label.length > 0);
      assert.ok(typeof role.focusInstructions === 'string' && role.focusInstructions.length > 10);
    }
  });
});

describe('DEFAULT_REVIEWERS', () => {
  it('contains bug-hunter and security-scanner', () => {
    assert.ok(DEFAULT_REVIEWERS.includes('bug-hunter'));
    assert.ok(DEFAULT_REVIEWERS.includes('security-scanner'));
  });
});

describe('resolveReviewerRoles', () => {
  it('returns valid and invalid split', () => {
    const { valid, invalid } = resolveReviewerRoles(['bug-hunter', 'nonexistent']);
    assert.deepEqual(valid, ['bug-hunter']);
    assert.deepEqual(invalid, ['nonexistent']);
  });

  it('uses DEFAULT_REVIEWERS when input is null', () => {
    const { valid, invalid } = resolveReviewerRoles(null);
    assert.deepEqual(valid, DEFAULT_REVIEWERS);
    assert.deepEqual(invalid, []);
  });

  it('uses DEFAULT_REVIEWERS when input is undefined', () => {
    const { valid } = resolveReviewerRoles(undefined);
    assert.deepEqual(valid, DEFAULT_REVIEWERS);
  });
});

describe('runReviewerOrchestration', () => {
  it('throws when no valid roles are provided', async () => {
    await assert.rejects(
      () => runReviewerOrchestration({ diff: makeDiff(), reviewers: ['nonexistent'] }),
      /No valid reviewer roles/
    );
  });

  it('returns reviewerResults with role metadata', async () => {
    const result = await runReviewerOrchestration({
      diff: makeDiff(),
      dryRun: true,
      reviewers: ['bug-hunter', 'security-scanner'],
    });
    assert.equal(result.reviewerResults.length, 2);
    assert.equal(result.reviewerResults[0].role, 'bug-hunter');
    assert.equal(result.reviewerResults[0].label, REVIEWER_ROLES['bug-hunter'].label);
    assert.ok('status' in result.reviewerResults[0]);
    assert.ok('findingsCount' in result.reviewerResults[0]);
  });

  it('tags all findings with reviewerRole', async () => {
    const result = await runReviewerOrchestration({
      diff: makeDiff(),
      dryRun: true,
      reviewers: ['bug-hunter'],
    });
    for (const f of result.findings) {
      assert.ok(typeof f.reviewerRole === 'string', `finding ${f.id} missing reviewerRole`);
    }
  });

  it('assigns unique finding IDs across multiple reviewers', async () => {
    const result = await runReviewerOrchestration({
      diff: makeDiff(),
      dryRun: true,
      reviewers: ['bug-hunter', 'security-scanner', 'test-gap'],
    });
    const ids = result.findings.map((f) => f.id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size, 'finding IDs must be unique');
  });

  it('returns classified findings object', async () => {
    const result = await runReviewerOrchestration({
      diff: makeDiff(),
      dryRun: true,
      reviewers: ['bug-hunter'],
    });
    assert.ok(result.classified, 'classified must be present');
    assert.ok(Array.isArray(result.classified.overview));
    assert.ok(Array.isArray(result.classified.suppressed));
    assert.ok(Array.isArray(result.classified.inlineCandidates));
  });

  it('uses DEFAULT_REVIEWERS when reviewers is not specified', async () => {
    const result = await runReviewerOrchestration({
      diff: makeDiff(),
      dryRun: true,
    });
    const roles = result.reviewerResults.map((r) => r.role);
    assert.deepEqual(roles, DEFAULT_REVIEWERS);
  });

  it('returns invalidRoles list for unknown roles', async () => {
    const result = await runReviewerOrchestration({
      diff: makeDiff(),
      dryRun: true,
      reviewers: ['bug-hunter', 'unknown-role'],
    });
    assert.ok(Array.isArray(result.invalidRoles));
    assert.ok(result.invalidRoles.includes('unknown-role'));
  });

  it('returns comments array', async () => {
    const result = await runReviewerOrchestration({
      diff: makeDiff(),
      dryRun: true,
      reviewers: ['bug-hunter'],
    });
    assert.ok(Array.isArray(result.comments));
  });

  it('returns debug metadata', async () => {
    const result = await runReviewerOrchestration({
      diff: makeDiff(),
      dryRun: true,
      reviewers: ['bug-hunter', 'security-scanner'],
    });
    assert.ok(typeof result.debug.succeededReviewers === 'number');
    assert.ok(typeof result.debug.failedReviewers === 'number');
  });
});
