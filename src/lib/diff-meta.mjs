import { classifyChangedFiles } from './file-classifier.mjs';

/**
 * Count changed lines from diff files (hunks).
 *
 * @param {Array<{ hunks?: Array<{ lines?: string[] }> }>} files
 * @returns {number}
 */
function countChangedLinesFromFiles(files) {
  let lines = 0;
  for (const file of files ?? []) {
    for (const hunk of file.hunks ?? []) {
      lines += (hunk.lines ?? []).filter((l) => l.startsWith('+') || l.startsWith('-')).length;
    }
  }
  return lines;
}

/**
 * Count changed lines from raw unified diff text.
 *
 * @param {string} diffText
 * @returns {number}
 */
function countChangedLinesFromText(diffText) {
  if (!diffText) return 0;
  let lines = 0;
  for (const line of diffText.split('\n')) {
    if ((line.startsWith('+') && !line.startsWith('+++')) || (line.startsWith('-') && !line.startsWith('---'))) {
      lines++;
    }
  }
  return lines;
}

/**
 * Extract metadata from a diff object for review depth control.
 *
 * @param {{ files?: Array<{ path: string, hunks?: Array<{ lines?: string[] }> }>, changedFiles?: string[], diffText?: string }} diff
 * @returns {{ fileCount: number, changedLines: number, fileTypes: object, hasTests: boolean, hasMigrations: boolean, hasSchemas: boolean }}
 */
export function extractDiffMeta(diff) {
  const files = diff?.files ?? [];
  const changedFiles = diff?.changedFiles ?? files.map((f) => f.path);

  const changedLines = files.length > 0
    ? countChangedLinesFromFiles(files)
    : countChangedLinesFromText(diff?.diffText);

  const fileTypes = classifyChangedFiles(changedFiles);

  return {
    fileCount: changedFiles.length,
    changedLines,
    fileTypes,
    hasTests: fileTypes.test.length > 0,
    hasMigrations: fileTypes.migration.length > 0,
    hasSchemas: fileTypes.schema.length > 0,
  };
}
