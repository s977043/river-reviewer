export const FINDING_SEVERITIES = /** @type {const} */ (['blocker', 'warning', 'nit']);
export const FINDING_CONFIDENCE = /** @type {const} */ (['high', 'medium', 'low']);

function normalizeWhitespace(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(text, maxChars) {
  const normalized = normalizeWhitespace(text);
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(0, maxChars - 1))}…`;
}

/**
 * Format a finding message for line-comments (`<file>:<line>: <message>`).
 * Evidence is already anchored by `<file>:<line>`, so we keep the message compact.
 * @param {{
 *   finding: string,
 *   evidence: string,
 *   impact: string,
 *   fix: string,
 *   severity: typeof FINDING_SEVERITIES[number],
 *   confidence: typeof FINDING_CONFIDENCE[number],
 * }} finding
 */
export function formatFindingMessage({ finding, evidence, impact, fix, severity, confidence }) {
  const sev = FINDING_SEVERITIES.includes(severity) ? severity : 'warning';
  const conf = FINDING_CONFIDENCE.includes(confidence) ? confidence : 'medium';

  return [
    `Finding: ${clamp(finding, 80)}`,
    `Evidence: ${clamp(evidence, 60)}`,
    `Impact: ${clamp(impact, 60)}`,
    `Fix: ${clamp(fix, 80)}`,
    `Severity: ${sev}`,
    `Confidence: ${conf}`,
  ].join(' ');
}

const LABEL_NAMES = ['Finding', 'Evidence', 'Impact', 'Fix', 'Severity', 'Confidence'];
const LABEL_ALTERNATION = LABEL_NAMES.join('|');

/**
 * Parse a labeled finding message string into structured fields.
 * @param {string} message
 * @returns {{ title: string, evidence: string[], impact: string, suggestion: string, severity: string|null, confidence: string|null }}
 */
export function parseFindingMessage(message) {
  const text = String(message ?? '');
  const get = (label) => {
    const re = new RegExp(`${label}:\\s*([^]*?)(?=\\s+(?:${LABEL_ALTERNATION}):|$)`, 'm');
    return (text.match(re)?.[1] ?? '').trim();
  };
  const evidenceText = get('Evidence');
  return {
    title: get('Finding'),
    evidence: evidenceText ? [evidenceText] : [],
    impact: get('Impact'),
    suggestion: get('Fix'),
    severity: get('Severity') || null,
    confidence: get('Confidence') || null,
  };
}

/**
 * Map internal severity vocabulary (blocker/warning/nit) to output schema vocabulary.
 * Accepts both vocabularies; unknown values default to 'major' (fail-safe).
 * @param {string|null|undefined} internalSeverity
 * @returns {'critical'|'major'|'minor'|'info'}
 */
export function normalizeSeverity(internalSeverity) {
  switch ((internalSeverity ?? '').toLowerCase().trim()) {
    case 'blocker':
    case 'critical':
      return 'critical';
    case 'warning':
    case 'major':
      return 'major';
    case 'nit':
    case 'minor':
      return 'minor';
    case 'info':
      return 'info';
    default:
      return 'major';
  }
}

/**
 * Validate whether a finding message contains the required labeled fields.
 * @param {string} message
 */
export function validateFindingMessage(message) {
  const text = String(message ?? '');
  const missing = [];
  for (const label of ['Finding:', 'Evidence:', 'Impact:', 'Fix:', 'Severity:', 'Confidence:']) {
    if (!text.includes(label)) missing.push(label);
  }

  const sevMatch = /Severity:\s*(\w+)/.exec(text);
  const confMatch = /Confidence:\s*(\w+)/.exec(text);
  const severity = sevMatch?.[1] ?? null;
  const confidence = confMatch?.[1] ?? null;

  const invalid = [];
  if (severity && !FINDING_SEVERITIES.includes(severity)) invalid.push(`Severity:${severity}`);
  if (confidence && !FINDING_CONFIDENCE.includes(confidence))
    invalid.push(`Confidence:${confidence}`);

  return {
    ok: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  };
}
