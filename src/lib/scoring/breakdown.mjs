function computeEvidenceStrength(finding) {
  const evidence = finding.evidence;
  if (!Array.isArray(evidence) || evidence.length === 0) return 0.0;
  const totalChars = evidence.reduce((sum, e) => sum + String(e ?? '').length, 0);
  if (totalChars === 0) return 0.0;
  if (totalChars <= 50) return 0.3;
  if (totalChars <= 150) return 0.6;
  return 1.0;
}

function computeReproducibility(finding) {
  const confidence = finding.confidence ?? 'medium';
  const severity = finding.severity ?? 'info';

  let base;
  if (confidence === 'high') base = 1.0;
  else if (confidence === 'medium') base = 0.5;
  else base = 0.2;

  if (severity === 'critical') base = Math.min(1.0, base + 0.2);
  if (severity === 'minor') base = Math.max(0.0, base - 0.1);

  return base;
}

function computeBlastRadius(finding) {
  const severity = finding.severity ?? 'info';
  const ruleId = String(finding.ruleId ?? '');

  let base;
  if (severity === 'critical') base = 1.0;
  else if (severity === 'major') base = 0.7;
  else if (severity === 'minor') base = 0.3;
  else base = 0.1;

  if (ruleId.includes('security')) base = Math.min(1.0, base * 1.2);

  return base;
}

function computeReviewerAgreement(finding) {
  const confidence = finding.confidence ?? 'medium';
  if (confidence === 'high') return 0.9;
  if (confidence === 'medium') return 0.7;
  return 0.4;
}

/**
 * Compute a 4-axis score breakdown for a single finding.
 *
 * @param {{
 *   evidence?: string[],
 *   confidence?: 'high' | 'medium' | 'low',
 *   severity?: string,
 *   ruleId?: string,
 * }} finding
 * @returns {{
 *   evidenceStrength: number,
 *   reproducibility: number,
 *   blastRadius: number,
 *   reviewerAgreement: number,
 *   composite: number,
 * }}
 */
export function computeFindingBreakdown(finding) {
  const evidenceStrength = computeEvidenceStrength(finding);
  const reproducibility = computeReproducibility(finding);
  const blastRadius = computeBlastRadius(finding);
  const reviewerAgreement = computeReviewerAgreement(finding);
  const composite =
    evidenceStrength * 0.3 +
    reproducibility * 0.25 +
    blastRadius * 0.3 +
    reviewerAgreement * 0.15;
  return { evidenceStrength, reproducibility, blastRadius, reviewerAgreement, composite };
}
