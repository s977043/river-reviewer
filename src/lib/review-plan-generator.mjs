/**
 * Determine review mode based on diff metadata.
 *
 * @param {{ fileCount: number, changedLines: number, hasMigrations: boolean, hasSchemas: boolean }} diffMeta
 * @param {object} [options]
 * @returns {'tiny' | 'medium' | 'large'}
 */
export function determineReviewMode(diffMeta, options = {}) {
  const { fileCount, changedLines, hasMigrations, hasSchemas } = diffMeta;

  let mode;
  if (fileCount <= 3 && changedLines <= 100) {
    mode = 'tiny';
  } else if (fileCount > 20 || changedLines > 800) {
    mode = 'large';
  } else {
    mode = 'medium';
  }

  if (hasMigrations || hasSchemas) {
    if (mode === 'tiny') mode = 'medium';
    else if (mode === 'medium') mode = 'large';
  }

  return mode;
}

/**
 * Get review depth configuration for the given mode.
 *
 * @param {'tiny' | 'medium' | 'large'} reviewMode
 * @returns {{ maxFindings: number, focusHint: string }}
 */
export function getReviewDepthConfig(reviewMode) {
  const configs = {
    tiny: { maxFindings: 3, focusHint: 'This is a small PR. Focus on the most critical issues only.' },
    medium: { maxFindings: 8, focusHint: 'Provide a balanced review covering important issues.' },
    large: { maxFindings: 15, focusHint: 'This is a large PR. Prioritize high-severity issues over minor style concerns.' },
  };
  return configs[reviewMode] ?? configs.medium;
}
