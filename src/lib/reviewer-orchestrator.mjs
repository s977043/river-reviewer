import { generateReview } from './review-engine.mjs';
import { classifyFindings } from './finding-classifier.mjs';

export const REVIEWER_ROLES = {
  'bug-hunter': {
    label: 'Bug Hunter',
    focusInstructions: `You are the Bug Hunter reviewer. Focus exclusively on:
- Logic errors, off-by-one mistakes, incorrect boolean conditions
- Null/undefined dereference and missing guard clauses
- Edge cases (empty collections, negative values, concurrent access)
- Incorrect or swallowed error handling
Report only issues in these categories. Do NOT report security vulnerabilities or style issues.`,
  },
  'security-scanner': {
    label: 'Security Scanner',
    focusInstructions: `You are the Security Scanner reviewer. Focus exclusively on:
- Injection vulnerabilities (SQL, shell command, path traversal, template injection)
- Authentication and authorization bypasses
- Sensitive data exposure (hardcoded secrets, PII in logs, tokens in URLs)
- Insecure defaults, missing input validation at trust boundaries
Report only security issues. Do NOT report logic bugs or style concerns.`,
  },
  'test-gap': {
    label: 'Test Gap Finder',
    focusInstructions: `You are the Test Gap Finder reviewer. Focus exclusively on:
- New or changed code paths that lack test coverage
- Missing edge-case tests (boundary values, error paths, empty inputs)
- Tests that are present but do not assert meaningful outcomes
Report only test coverage gaps. Do NOT report implementation bugs or style issues.`,
  },
};

export const DEFAULT_REVIEWERS = ['bug-hunter', 'security-scanner'];

export function resolveReviewerRoles(reviewers) {
  const names = reviewers ?? DEFAULT_REVIEWERS;
  const valid = names.filter((n) => REVIEWER_ROLES[n]);
  const invalid = names.filter((n) => !REVIEWER_ROLES[n]);
  return { valid, invalid };
}

export async function runReviewerOrchestration({
  diff,
  plan,
  phase,
  dryRun = false,
  model,
  apiKey,
  projectRules,
  riskAssessment,
  memoryContext,
  fileTypes,
  relatedADRs,
  reviewMode,
  config,
  reviewers,
} = {}) {
  const { valid: roles, invalid } = resolveReviewerRoles(reviewers);

  if (!roles.length) {
    throw new Error(
      `No valid reviewer roles. Got: [${(reviewers ?? []).join(', ')}]. Valid: [${Object.keys(REVIEWER_ROLES).join(', ')}]`
    );
  }

  const generateArgs = {
    diff,
    plan,
    phase,
    dryRun,
    model,
    apiKey,
    riskAssessment,
    memoryContext,
    fileTypes,
    relatedADRs,
    reviewMode,
    config,
  };

  // Run each role in parallel; partial failure is tolerated
  const settled = await Promise.allSettled(
    roles.map((roleName) => {
      const role = REVIEWER_ROLES[roleName];
      const roleRules = [role.focusInstructions, projectRules].filter(Boolean).join('\n\n');
      return generateReview({ ...generateArgs, projectRules: roleRules }).then((result) => ({
        ...result,
        reviewerRole: roleName,
      }));
    })
  );

  const succeeded = settled
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value);
  const failed = settled.filter((r) => r.status === 'rejected');

  // Merge findings with globally unique IDs and role tags
  let nextId = 1;
  const allFindings = succeeded.flatMap((r) =>
    (r.findings ?? []).map((f) => ({
      ...f,
      id: `rr-${nextId++}`,
      reviewerRole: r.reviewerRole,
    }))
  );

  const allComments = succeeded.flatMap((r) => r.comments ?? []);
  const classified = classifyFindings(allFindings, { reviewMode: reviewMode ?? 'medium' });

  const reviewerResults = roles.map((name, i) => ({
    role: name,
    label: REVIEWER_ROLES[name].label,
    status: settled[i].status,
    findingsCount:
      settled[i].status === 'fulfilled' ? (settled[i].value.findings?.length ?? 0) : 0,
    error: settled[i].status === 'rejected' ? String(settled[i].reason?.message ?? 'unknown') : null,
  }));

  return {
    comments: allComments,
    findings: allFindings,
    classified,
    reviewerResults,
    invalidRoles: invalid,
    prompt: succeeded[0]?.prompt ?? null,
    promptTruncated: succeeded.some((r) => r.promptTruncated),
    llmModel: succeeded[0]?.llmModel ?? null,
    debug: {
      succeededReviewers: succeeded.length,
      failedReviewers: failed.length,
    },
  };
}
