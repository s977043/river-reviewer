/**
 * Verify individual review findings before emission.
 *
 * Rule-based checks only (no LLM calls). Returns verification result
 * with per-check details. Rejected findings should be logged but not emitted.
 */

/**
 * Severity hierarchy for comparison (higher number = more severe).
 * Internal vocabulary is mapped to output schema equivalents.
 * @see .claude/rules/review-core.md for the canonical mapping
 */
const SEVERITY_RANK = /** @type {const} */ ({
  info: 0,
  minor: 1,
  major: 2,
  critical: 3,
});

/**
 * Map internal vocabulary to output schema severity.
 * blocker → critical, warning → major, nit → minor.
 * Unknown values fall back to "major" (fail-safe per review-core.md).
 * @param {string} raw
 * @returns {keyof typeof SEVERITY_RANK}
 */
function normalizeSeverity(raw) {
  const lower = String(raw ?? '')
    .toLowerCase()
    .trim();
  if (lower === 'blocker') return 'critical';
  if (lower === 'warning') return 'major';
  if (lower === 'nit') return 'minor';
  if (lower in SEVERITY_RANK) return /** @type {keyof typeof SEVERITY_RANK} */ (lower);
  return 'major'; // fail-safe
}

/**
 * Check that the finding message contains "Evidence:" followed by
 * at least 5 non-whitespace characters of content.
 * @param {{ message?: string }} finding
 * @returns {boolean}
 */
function checkEvidenceExists(finding) {
  const text = String(finding?.message ?? '');
  const match = /Evidence:\s*(\S.{4,})/.exec(text);
  return match !== null;
}

/**
 * Check that the finding's phase matches the skill's declared phase.
 * Lenient: returns true when either side is missing phase information.
 * @param {{ phase?: string }} finding
 * @param {{ metadata?: { phase?: string } }} skill
 * @returns {boolean}
 */
function checkPhaseCoherent(finding, skill) {
  const findingPhase = finding?.phase;
  const skillPhase = skill?.metadata?.phase;
  if (!findingPhase || !skillPhase) return true;
  return findingPhase === skillPhase;
}

/**
 * Check that the finding severity does not exceed the skill's declared
 * severity level. Uses the internal vocabulary mapping from review-core.md.
 * Lenient: returns true when severity cannot be determined from either side.
 * @param {{ message?: string }} finding
 * @param {{ metadata?: { severity?: string } }} skill
 * @returns {boolean}
 */
function checkSeverityJustified(finding, skill) {
  const text = String(finding?.message ?? '');
  const sevMatch = /Severity:\s*(\w+)/.exec(text);
  if (!sevMatch) return true;

  const skillSeverity = skill?.metadata?.severity;
  if (!skillSeverity) return true;

  const findingNormalized = normalizeSeverity(sevMatch[1]);
  const skillNormalized = normalizeSeverity(skillSeverity);

  const findingRank = SEVERITY_RANK[findingNormalized] ?? SEVERITY_RANK.major;
  const skillRank = SEVERITY_RANK[skillNormalized] ?? SEVERITY_RANK.major;

  return findingRank <= skillRank;
}

/**
 * Check that the finding message contains "Fix:" or "Suggestion:" followed
 * by at least 10 characters of actionable content.
 * @param {{ message?: string }} finding
 * @returns {boolean}
 */
function checkSuggestionActionable(finding) {
  const text = String(finding?.message ?? '');
  const match = /(?:Fix|Suggestion):\s*(.{10,})/.exec(text);
  return match !== null;
}

/**
 * @param {{ finding: object, diff: string, skill: object }} params
 * @returns {{ verified: boolean, reasons: string[], checks: object }}
 */
export function verifyFinding({ finding, diff, skill }) {
  const checks = {
    evidenceExists: checkEvidenceExists(finding),
    phaseCoherent: checkPhaseCoherent(finding, skill),
    severityJustified: checkSeverityJustified(finding, skill),
    suggestionActionable: checkSuggestionActionable(finding),
  };

  const reasons = [];
  if (!checks.evidenceExists) reasons.push('No evidence provided in finding');
  if (!checks.phaseCoherent)
    reasons.push(
      `Phase mismatch: finding phase does not match skill phase "${skill?.metadata?.phase}"`
    );
  if (!checks.severityJustified)
    reasons.push('Severity exceeds skill severity without justification');
  if (!checks.suggestionActionable) reasons.push('Fix/suggestion is missing or too brief');

  return {
    verified: reasons.length === 0,
    reasons,
    checks,
  };
}
