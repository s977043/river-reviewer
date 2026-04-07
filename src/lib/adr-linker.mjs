import fs from 'node:fs';
import path from 'node:path';

/**
 * Scan known ADR/spec directories and find documents relevant to changed files.
 *
 * @param {string} repoRoot - Repository root path
 * @param {{ changedFiles?: string[], keywords?: string[] }} options
 * @returns {{ path: string, title: string, matchReason: string }[]}
 */
export function findRelatedADRs(repoRoot, { changedFiles = [], keywords = [] } = {}) {
  const adrDirs = ['docs/adr', 'pages/explanation', 'specs'];
  const results = [];

  for (const dir of adrDirs) {
    const fullDir = path.join(repoRoot, dir);
    if (!fs.existsSync(fullDir)) continue;

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
