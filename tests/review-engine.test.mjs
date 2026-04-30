import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPrompt, generateReview, parseLineComments } from '../src/lib/review-engine.mjs';

const diffText = `diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -10,0 +11,2 @@
+const value = 1;
+console.log(value);
`;

const diff = {
  diffText,
  files: [
    {
      path: 'src/app.ts',
      hunks: [
        { newStart: 11, addedLines: [11, 12], lines: [], oldStart: 10, oldLines: 0, newLines: 2 },
      ],
      addedLines: [11, 12],
    },
  ],
  changedFiles: ['src/app.ts'],
};

const plan = {
  selected: [
    { metadata: { id: 'skill-1', name: 'Skill One', phase: 'midstream', applyTo: ['src/**'] } },
  ],
  skipped: [],
};

// --- #692 PR-D: defense-in-depth redaction at the artifact boundary ---
//
// Even after PR-C redacts repo context before it reaches the prompt, secrets
// could still slip in through other channels (project rules with a pasted
// token, additional instructions, etc.). PR-D defends the artifact boundary
// by redacting both `debug.promptPreview` and the returned `prompt` so any
// such leak is masked before leaving process memory. The LLM call itself is
// unaffected — it still sees the original prompt as it must.

test('generateReview redacts secrets in debug.promptPreview and returned prompt (#692 PR-D)', async () => {
  // Build a token at runtime so GitHub Push Protection does not flag this
  // file (same trick as tests/secret-redactor.test.mjs).
  const ghpat =
    'ghp_' + ['kZpL3xQ8mNvW', '5tJfRy2HcBd9', 'eAuQs7TgwY1i', 'OzMrPqXdLcVy'].join('').slice(0, 36);
  const result = await generateReview({
    diff,
    plan,
    phase: 'midstream',
    dryRun: true,
    includeFallback: false,
    // Inject a leaked token through `additionalInstructions`. After PR-D
    // both promptPreview and the returned prompt must mask it.
    config: {
      review: {
        additionalInstructions: ['Do not leak the token: ' + ghpat],
      },
    },
  });

  assert.match(result.debug.promptPreview, /<REDACTED:githubToken>/);
  assert.equal(/ghp_[A-Za-z0-9]{36,}/.test(result.debug.promptPreview), false);
  assert.match(result.prompt, /<REDACTED:githubToken>/);
  assert.equal(/ghp_[A-Za-z0-9]{36,}/.test(result.prompt), false);
});

test('generateReview runs heuristics when LLM is skipped', async () => {
  // スキルが選択されている場合、ヒューリスティックが実行される。
  // ヒューリスティックが何も検出しなかった場合、コメントは0件となる（正常な動作）。
  const result = await generateReview({
    diff,
    plan,
    phase: 'midstream',
    dryRun: true,
    includeFallback: false,
  });
  assert.equal(result.debug.llmUsed, false);
  assert.ok(result.prompt.includes('River Reviewer'));
  // dry-runモードでもヒューリスティックが実行される
  assert.equal(result.debug.heuristicsUsed, true);
  // スキルが選択されているが検出パターンがない場合、コメントは0件
  assert.equal(result.comments.length, 0);
});

test('parseLineComments parses structured lines', () => {
  const parsed = parseLineComments('src/app.ts:12: message body\nNOISE');
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].file, 'src/app.ts');
  assert.equal(parsed[0].line, 12);
  assert.equal(parsed[0].message, 'message body');
});

test('parseLineComments understands NO_ISSUES', () => {
  const parsed = parseLineComments('NO_ISSUES');
  assert.deepEqual(parsed, []);
});

test('buildPrompt injects project rules when provided', () => {
  const { prompt } = buildPrompt({
    diffText,
    diffFiles: diff.files,
    plan,
    phase: 'midstream',
    projectRules: '- Use App Router',
  });
  assert.match(prompt, /Project-specific review rules/i);
  assert.match(prompt, /Use App Router/);
});

test('generateReview: verifier stats exist in debug output', async () => {
  const result = await generateReview({
    diff: { diffText: '+const x = 1;', files: [], changedFiles: [] },
    plan: { selected: [] },
    phase: 'midstream',
    dryRun: true,
  });
  // verifierStats should always be present after the verifier pass
  assert.ok(result.debug.verifierStats !== undefined, 'verifierStats should exist in debug');
  assert.equal(typeof result.debug.verifierStats.total, 'number');
  assert.equal(typeof result.debug.verifierStats.verified, 'number');
  assert.equal(typeof result.debug.verifierStats.rejected, 'number');
  // verifierRejected should be an array (possibly empty)
  assert.ok(Array.isArray(result.debug.verifierRejected), 'verifierRejected should be an array');
});

test('buildPrompt includes ADR context section when relatedADRs provided', () => {
  const relatedADRs = [
    {
      title: 'ADR-001 Eval Loop',
      path: 'docs/adr/001-eval.md',
      matchReason: 'keyword: evaluation',
    },
    {
      title: 'ADR-002 Scoring',
      path: 'docs/adr/002-scoring.md',
      matchReason: 'references: src/app.ts',
    },
  ];
  const { prompt } = buildPrompt({
    diffText,
    diffFiles: diff.files,
    plan,
    phase: 'midstream',
    projectRules: null,
    relatedADRs,
  });
  assert.match(prompt, /Related ADRs\/Specs/);
  assert.match(prompt, /ADR-001 Eval Loop/);
  assert.match(prompt, /ADR-002 Scoring/);
  assert.match(prompt, /設計文書との整合性/);
});

test('buildPrompt omits ADR context section when relatedADRs is empty', () => {
  const { prompt } = buildPrompt({
    diffText,
    diffFiles: diff.files,
    plan,
    phase: 'midstream',
    projectRules: null,
    relatedADRs: [],
  });
  assert.ok(!prompt.includes('Related ADRs/Specs'));
});

test('buildPrompt omits ADR context section when relatedADRs is undefined', () => {
  const { prompt } = buildPrompt({
    diffText,
    diffFiles: diff.files,
    plan,
    phase: 'midstream',
    projectRules: null,
  });
  assert.ok(!prompt.includes('Related ADRs/Specs'));
});

test('buildPrompt switches language based on config', () => {
  const { prompt, language } = buildPrompt({
    diffText,
    diffFiles: diff.files,
    plan,
    phase: 'midstream',
    projectRules: null,
    config: { review: { language: 'en' } },
  });
  assert.equal(language, 'en');
  assert.match(prompt, /Write the <message> in English/);
});
