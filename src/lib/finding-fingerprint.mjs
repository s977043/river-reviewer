import { createHash } from 'node:crypto';

/**
 * Stable fingerprint for a finding so that the same logical issue can be
 * matched across review runs even when IDs regenerate.
 *
 * Strategy: hash(ruleId + file + first-60-chars-of-message).
 * Intentionally omits lineStart/lineEnd because line numbers shift as code
 * changes, but the same logical finding should still be considered persisting.
 */
export function computeFingerprint(finding) {
  const ruleId = String(finding.ruleId ?? 'unknown');
  const file = String(finding.file ?? '');
  // Normalize message: lowercase, collapse whitespace, take first 60 chars
  const msgNorm = String(finding.message ?? finding.title ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  const raw = `${ruleId}::${file}::${msgNorm}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/**
 * Annotate findings with their fingerprint (non-mutating).
 */
export function annotateFingerprints(findings) {
  return findings.map((f) => ({ ...f, fingerprint: computeFingerprint(f) }));
}
