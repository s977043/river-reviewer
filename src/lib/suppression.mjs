import crypto from 'node:crypto';
import { appendEntry, loadMemory, queryMemory } from './riverbed-memory.mjs';

/**
 * Create a stable content hash from a finding's key fields.
 * @param {{ file?: string, message?: string, ruleId?: string }} finding
 * @returns {string}
 */
export function hashFinding(finding) {
  const key = [finding.file || '', finding.message || '', finding.ruleId || ''].join('::');
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
}

/**
 * Extract subsystem identifier from a file path.
 * e.g. 'src/auth/handler.ts' -> 'auth', 'src/lib/utils.mjs' -> 'lib'
 * @param {string} filePath
 * @returns {string}
 */
export function inferSubsystem(filePath) {
  const parts = filePath.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'src') return parts[1];
  if (parts.length >= 2) return parts[0];
  return '';
}

/**
 * Create a suppression record in Riverbed Memory.
 * @param {object} options
 * @returns {object} The created suppression entry
 */
export function createSuppression({
  indexPath,
  findingId,
  findingHash,
  filePaths,
  rationale,
  scope = 'file',
  expiresAt,
  prNumber,
  author = 'river-reviewer',
}) {
  if (!rationale) throw new Error('Suppression requires a rationale');

  const entry = {
    id: 'suppression-' + (findingHash || hashFinding({ file: filePaths?.[0] })) + '-' + Date.now(),
    type: 'suppression',
    title: 'Suppress: ' + (findingId || 'finding'),
    content: rationale,
    metadata: {
      createdAt: new Date().toISOString(),
      author,
      tags: ['suppression', 'active', scope],
      relatedFiles: filePaths ?? [],
      ...(prNumber ? { links: ['PR#' + prNumber] } : {}),
    },
    context: {
      findingId: findingId || null,
      findingHash: findingHash || null,
      scope,
      active: true,
      ...(expiresAt ? { expiresAt } : {}),
    },
  };

  appendEntry(indexPath, entry);
  return entry;
}

/**
 * Revoke a suppression by appending a resurface entry (append-only).
 * @param {string} indexPath
 * @param {string} suppressionId
 * @param {{ author?: string, reason?: string }} options
 * @returns {object} The resurface entry
 */
export function revokeSuppression(
  indexPath,
  suppressionId,
  { author = 'river-reviewer', reason = 'revoked' } = {}
) {
  const entry = {
    id: 'resurface-' + suppressionId + '-' + Date.now(),
    type: 'resurface',
    title: 'Revoke: ' + suppressionId,
    content: reason,
    metadata: {
      createdAt: new Date().toISOString(),
      author,
      tags: ['resurface', 'revocation'],
    },
    context: {
      suppressionId,
      action: 'revoke',
    },
  };

  appendEntry(indexPath, entry);
  return entry;
}

/**
 * Check if any of the changed files match the suppression's scope.
 * Shared by findActiveSuppressions and resurface logic.
 * @param {string} scope - 'global' | 'subsystem' | 'file'
 * @param {string[]} relatedFiles - Files associated with the suppression
 * @param {string[]} changedFiles - Files in the current change set
 * @returns {boolean}
 */
export function matchesScopeFiles(scope, relatedFiles, changedFiles) {
  if (!relatedFiles.length || !changedFiles.length) return false;
  if (scope === 'global') return true;
  if (scope === 'subsystem') {
    const suppressionSubs = new Set(relatedFiles.map(inferSubsystem).filter(Boolean));
    return changedFiles.some((fp) => suppressionSubs.has(inferSubsystem(fp)));
  }
  return changedFiles.some((fp) => relatedFiles.includes(fp));
}

/**
 * Find active suppressions that overlap with the given file paths.
 * Filters out expired and revoked suppressions.
 * @param {{ entries: object[] }} index - Loaded memory index
 * @param {string[]} filePaths
 * @returns {object[]}
 */
export function findActiveSuppressions(index, filePaths) {
  // includeInactive: true preserves pre-lifecycle behavior. Revocations via
  // resurface must survive supersession so that a once-revoked suppression
  // does not silently reactivate when the revoking entry is superseded.
  const suppressions = queryMemory(index, { type: 'suppression', includeInactive: true });
  const revocations = new Set(
    queryMemory(index, { type: 'resurface', includeInactive: true })
      .filter((e) => e.context?.action === 'revoke')
      .map((e) => e.context?.suppressionId)
      .filter(Boolean)
  );

  const now = new Date().toISOString();

  return suppressions.filter((s) => {
    if (!s.context?.active) return false;
    if (revocations.has(s.id)) return false;
    if (s.context?.expiresAt && s.context.expiresAt < now) return false;

    const related = s.metadata?.relatedFiles ?? [];
    const scope = s.context?.scope || 'file';
    return matchesScopeFiles(scope, related, filePaths);
  });
}
