import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_ADR_DIRS = ['docs/adr', 'pages/explanation', 'specs'];

/**
 * Scan known ADR/spec directories and find documents relevant to changed files.
 *
 * @param {string} repoRoot - Repository root path
 * @param {{ changedFiles?: string[], keywords?: string[], extraDirs?: string[] }} options
 *   extraDirs: additional spec/ADR directories from project config
 *   (review.specDirs), merged with the defaults and de-duplicated.
 * @returns {{ path: string, title: string, matchReason: string }[]}
 */
export function findRelatedADRs(
  repoRoot,
  { changedFiles = [], keywords = [], extraDirs = [] } = {}
) {
  // Resolve and validate scan directories. extraDirs come from user config
  // (review.specDirs); on shared/fork CI a traversal like '../../etc' must not
  // escape the repo. Keep only in-repo, existing directories; de-dupe by path.
  const candidateDirs = [
    ...DEFAULT_ADR_DIRS,
    ...(Array.isArray(extraDirs) ? extraDirs.filter(Boolean) : []),
  ];
  const adrDirs = [];
  const seen = new Set();
  for (const dir of candidateDirs) {
    const fullDir = path.resolve(repoRoot, dir);
    const relative = path.relative(repoRoot, fullDir);
    // Reject the repo root itself, path traversal, absolute escapes, duplicates.
    if (
      relative === '' ||
      relative.startsWith('..') ||
      path.isAbsolute(relative) ||
      seen.has(relative)
    ) {
      continue;
    }
    try {
      if (fs.statSync(fullDir).isDirectory()) {
        seen.add(relative);
        adrDirs.push(relative);
      }
    } catch {
      // missing or inaccessible → skip
    }
  }
  const results = [];

  for (const dir of adrDirs) {
    const fullDir = path.join(repoRoot, dir);
    const files = fs.readdirSync(fullDir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(path.join(fullDir, file), 'utf-8');
      const title = extractTitle(content) || file;

      // Match by keyword in content
      for (const kw of keywords) {
        if (content.toLowerCase().includes(kw.toLowerCase())) {
          results.push({ path: filePath, title, matchReason: `keyword: ${kw}` });
          break; // one match per file is enough
        }
      }

      // Match by changed file mention in content
      for (const cf of changedFiles) {
        const basename = cf.split('/').pop();
        if (content.includes(cf) || content.includes(basename)) {
          if (!results.some((r) => r.path === filePath)) {
            results.push({
              path: filePath,
              title,
              matchReason: `references: ${cf}`,
            });
          }
          break;
        }
      }
    }
  }

  return results;
}

function extractTitle(markdown) {
  const match = /^#\s+(.+)/m.exec(markdown);
  return match ? match[1].trim() : null;
}
