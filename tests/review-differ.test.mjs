import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { diffReviews, formatRegressionSummary } from '../src/lib/review-differ.mjs';

function makeFinding(overrides = {}) {
  return {
    id: 'rr-1',
    ruleId: 'null-safety',
    file: 'src/foo.mjs',
    lineStart: 10,
    lineEnd: 10,
    title: 'Possible null dereference in foo',
    message: 'Finding: null-check Evidence: obj.foo called without guard here Impact: crash Fix: guard Severity: major Confidence: high',
    severity: 'major',
    confidence: 'high',
    status: 'open',
    evidence: ['obj.foo called without guard'],
    ...overrides,
  };
}

describe('diffReviews', () => {
  it('all-new when previous is empty', () => {
    const curr = [makeFinding(), makeFinding({ ruleId: 'sql-injection', file: 'src/bar.mjs', message: 'Finding: sql Evidence: query concat Impact: injection Fix: parameterize Severity: critical Confidence: high' })];
    const diff = diffReviews([], curr);
    assert.equal(diff.new.length, 2);
    assert.equal(diff.resolved.length, 0);
    assert.equal(diff.persisting.length, 0);
    assert.equal(diff.summary.newCount, 2);
  });

  it('all-resolved when current is empty', () => {
    const prev = [makeFinding()];
    const diff = diffReviews(prev, []);
    assert.equal(diff.resolved.length, 1);
    assert.equal(diff.new.length, 0);
    assert.equal(diff.summary.resolvedCount, 1);
  });

  it('persisting when same finding appears in both', () => {
    const f = makeFinding();
    const diff = diffReviews([f], [f]);
    assert.equal(diff.persisting.length, 1);
    assert.equal(diff.new.length, 0);
    assert.equal(diff.resolved.length, 0);
  });

  it('line number change does not create new finding', () => {
    const prev = makeFinding({ lineStart: 10, lineEnd: 10 });
    const curr = makeFinding({ lineStart: 25, lineEnd: 25 });
    const diff = diffReviews([prev], [curr]);
    assert.equal(diff.persisting.length, 1, 'should be persisting, not new');
    assert.equal(diff.new.length, 0);
  });

  it('score_changed when confidence changes', () => {
    const prev = makeFinding({ confidence: 'low' });
    const curr = makeFinding({ confidence: 'high' });
    const diff = diffReviews([prev], [curr]);
    // Score difference between low(0.4) and high(0.9) > threshold 0.05
    assert.equal(diff.scoreChanged.length, 1);
    assert.equal(diff.scoreChanged[0].changeStatus, 'score_changed');
    assert.ok(diff.scoreChanged[0].scoreDelta > 0, 'positive delta when confidence improves');
  });

  it('regression score = new - resolved', () => {
    const prev = [makeFinding()];
    const curr = [
      makeFinding({ ruleId: 'sql-injection', file: 'src/bar.mjs', message: 'Finding: sql Evidence: query concat here Impact: injection Fix: param Severity: critical Confidence: high' }),
      makeFinding({ ruleId: 'path-traversal', file: 'src/baz.mjs', message: 'Finding: path Evidence: user path used directly Impact: traversal Fix: sanitize Severity: critical Confidence: high' }),
    ];
    const diff = diffReviews(prev, curr);
    assert.equal(diff.summary.regressionScore, 2 - 1);
  });

  it('handles null/undefined inputs gracefully', () => {
    const diff = diffReviews(null, null);
    assert.equal(diff.new.length, 0);
    assert.equal(diff.resolved.length, 0);
    assert.equal(diff.summary.totalPrevious, 0);
  });

  it('each compared finding has fingerprint', () => {
    const prev = [makeFinding()];
    const curr = [makeFinding()];
    const diff = diffReviews(prev, curr);
    for (const f of [...diff.new, ...diff.resolved, ...diff.persisting, ...diff.scoreChanged]) {
      assert.ok(typeof f.fingerprint === 'string' && f.fingerprint.length > 0);
    }
  });
});

describe('formatRegressionSummary', () => {
  it('includes summary table', () => {
    const diff = diffReviews([], [makeFinding()]);
    const md = formatRegressionSummary(diff);
    assert.ok(md.includes('## Regression Review Summary'));
    assert.ok(md.includes('New findings'));
    assert.ok(md.includes('Resolved findings'));
  });

  it('lists new findings with severity', () => {
    const diff = diffReviews([], [makeFinding({ severity: 'critical' })]);
    const md = formatRegressionSummary(diff);
    assert.ok(md.includes('[critical]'));
  });

  it('lists resolved findings with strikethrough', () => {
    const diff = diffReviews([makeFinding()], []);
    const md = formatRegressionSummary(diff);
    assert.ok(md.includes('~~'));
  });
});
