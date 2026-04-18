/**
 * Default scoring rubric for deterministic review scoring.
 *
 * Derived from unilabo/site-management-system's review-prompt.md, adapted to
 * river-reviewer's skill taxonomy. Scores are **derived from finding severity
 * and axis**, not AI-generated. See docs/review/scoring-model.md for rationale.
 */

export const AXES = /** @type {const} */ ([
  'readability',
  'extensibility',
  'performance',
  'security',
  'maintainability',
]);

export const AXIS_LABELS_JA = {
  readability: '可読性',
  extensibility: '拡張性',
  performance: 'パフォーマンス',
  security: 'セキュリティ',
  maintainability: '保守性',
};

/**
 * Regex patterns mapping ruleId to axis. First match wins.
 * Falls back to `maintainability` when no pattern matches.
 *
 * Patterns use a leading `\b` to anchor at word boundary, but intentionally
 * omit a trailing `\b` so that keyword prefixes match extended identifiers
 * (e.g. `depend` matches `dependency`, `read` matches `readability`).
 */
export const AXIS_PATTERNS = [
  {
    axis: 'security',
    pattern: /\b(sec|security|auth|authz|authn|injection|xss|csrf|crypto)/i,
  },
  {
    axis: 'performance',
    pattern: /\b(perf|performance|n-?plus-?one|n1\b|slow|query|memory)/i,
  },
  {
    axis: 'extensibility',
    pattern: /\b(arch|architecture|depend|layer|fat|coupling|boundary)/i,
  },
  {
    axis: 'readability',
    pattern: /\b(read|readability|naming|complexity|style|clarity)/i,
  },
  {
    axis: 'maintainability',
    pattern: /\b(test|coverage|maint|maintainability|doc|comment)/i,
  },
];

/**
 * Default deduction table.
 * Per-severity deductions per axis. Security is penalized more heavily.
 */
export const DEFAULT_DEDUCTIONS = {
  security: { critical: 50, major: 30, minor: 15, info: 5 },
  readability: { critical: 30, major: 20, minor: 10, info: 3 },
  extensibility: { critical: 30, major: 20, minor: 10, info: 3 },
  performance: { critical: 30, major: 20, minor: 10, info: 3 },
  maintainability: { critical: 30, major: 20, minor: 10, info: 3 },
};

/**
 * Verdict thresholds (display only; HITL-respecting).
 *
 * `auto-approve` is a recommendation for automation (e.g. CI bot), NOT a policy
 * to merge without human review. river-reviewer remains HITL-first.
 */
export const VERDICT_THRESHOLDS = {
  autoApprove: {
    minOverall: 90,
    minSecurity: 95,
    maxCritical: 0,
    maxMajor: 0,
  },
  humanReviewRecommended: {
    minOverall: 70,
    maxCritical: 0,
  },
  // below humanReviewRecommended threshold -> humanReviewRequired
};
