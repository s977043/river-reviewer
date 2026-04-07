import { classifyChangedFiles } from './file-classifier.mjs';

/**
 * Analyze test coverage gaps based on changed file classification.
 *
 * @param {string[]} changedFiles - Array of changed file paths
 * @returns {{ appFilesChanged: number, testFilesChanged: number, gapFiles: string[], coverageRatio: number, riskLevel: 'low'|'medium'|'high' }}
 */
export function analyzeTestImpact(changedFiles) {
  const classified = classifyChangedFiles(changedFiles);

  const appFiles = classified.app;
  const testFiles = classified.test;

  // Files in app that likely need corresponding tests
  const gapFiles = appFiles.filter((appFile) => {
    const basename =
      appFile
        .split('/')
        .pop()
        ?.replace(/\.[^.]+$/, '') ?? '';
    // Check if any test file references this app file's basename
    return !testFiles.some((testFile) => testFile.includes(basename));
  });

  const appCount = appFiles.length;
  const testCount = testFiles.length;
  const coverageRatio = appCount === 0 ? 1 : testCount / appCount;

  let riskLevel = 'low';
  if (appCount > 0 && testCount === 0) riskLevel = 'high';
  else if (appCount > 0 && gapFiles.length >= appCount / 2) riskLevel = 'medium';

  return {
    appFilesChanged: appCount,
    testFilesChanged: testCount,
    gapFiles,
    coverageRatio: Math.min(coverageRatio, 1), // cap at 1
    riskLevel,
  };
}
