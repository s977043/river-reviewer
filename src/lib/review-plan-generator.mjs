const REVIEW_MODES = new Set(['tiny', 'medium', 'large']);

/**
 * Agent-agnostic depth vocabulary mapped onto the existing review modes.
 * Lets users force a depth without introducing a parallel sizing system.
 */
export const DEPTH_TO_REVIEW_MODE = Object.freeze({
  quick: 'tiny',
  standard: 'medium',
  thorough: 'large',
});

/**
 * Resolve a user-facing depth name to a review mode, or null when unset.
 *
 * @param {string|null|undefined} depth
 * @returns {'tiny' | 'medium' | 'large' | null}
 */
export function resolveDepthToReviewMode(depth) {
  if (!depth) return null;
  return DEPTH_TO_REVIEW_MODE[depth] ?? null;
}

/**
 * Determine review mode based on diff metadata.
 *
 * @param {{ fileCount: number, changedLines: number, hasMigrations: boolean, hasSchemas: boolean }} diffMeta
 * @param {{ manualMode?: 'tiny' | 'medium' | 'large' | null }} [options]
 * @returns {'tiny' | 'medium' | 'large'}
 */
export function determineReviewMode(diffMeta, options = {}) {
  // An explicit manual mode overrides diff-size auto-detection.
  if (options.manualMode && REVIEW_MODES.has(options.manualMode)) {
    return options.manualMode;
  }

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
    tiny: {
      maxFindings: 3,
      focusHint: 'This is a small PR. Focus on the most critical issues only.',
    },
    medium: { maxFindings: 8, focusHint: 'Provide a balanced review covering important issues.' },
    large: {
      maxFindings: 15,
      focusHint: 'This is a large PR. Prioritize high-severity issues over minor style concerns.',
    },
  };
  return configs[reviewMode] ?? configs.medium;
}
