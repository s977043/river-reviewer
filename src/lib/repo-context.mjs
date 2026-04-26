import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** Default token budget (max characters per section) */
const DEFAULT_BUDGET = {
  fullFile: 2000,
  usages: 1000,
  tests: 2000,
  i18n: 1000,
  config: 500,
  docs: 1500,
};

const TOTAL_BUDGET = 8000;

/** Config file basenames to look for */
const CONFIG_BASENAMES = [
  'package.json',
  'tsconfig.json',
  'tsconfig.base.json',
  'tsconfig.build.json',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yaml',
  '.eslintrc.yml',
  'eslint.config.js',
  'eslint.config.mjs',
  'vite.config.js',
  'vite.config.ts',
  'vitest.config.js',
  'vitest.config.ts',
];

/**
 * Read a file safely, returning null if not found.
 * @param {string} filePath
 * @returns {Promise<string|null>}
 */
async function safeReadFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Collect full text of changed files.
 * @param {string[]} changedFiles
 * @param {string} cwd
 * @param {number} maxChars
 * @returns {Promise<Array<{title: string, content: string}>>}
 */
async function collectFullTexts(changedFiles, cwd, maxChars) {
  const sections = [];
  for (const filePath of changedFiles) {
    const absPath = path.resolve(cwd, filePath);
    const content = await safeReadFile(absPath);
    if (content === null) continue;
    const truncated =
      content.length > maxChars ? content.slice(0, maxChars) + '\n...[truncated]' : content;
    sections.push({ title: `File: ${filePath}`, content: truncated });
  }
  return sections;
}

/**
 * Collect sibling files in the same directories as changed files (up to 5 per dir, excluding changed files).
 * @param {string[]} changedFiles
 * @param {string} cwd
 * @returns {Promise<Array<{title: string, content: string}>>}
 */
async function collectSiblingFiles(changedFiles, cwd) {
  const changedSet = new Set(changedFiles.map((f) => path.resolve(cwd, f)));
  const seenDirs = new Set();
  const sections = [];

  for (const filePath of changedFiles) {
    const absPath = path.resolve(cwd, filePath);
    const dir = path.dirname(absPath);
    if (seenDirs.has(dir)) continue;
    seenDirs.add(dir);

    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    const siblings = entries
      .filter((e) => e.isFile() && !changedSet.has(path.join(dir, e.name)))
      .slice(0, 5)
      .map((e) => path.join(dir, e.name));

    if (siblings.length) {
      const listing = siblings.map((s) => `- ${path.relative(cwd, s)}`).join('\n');
      sections.push({ title: 'Sibling files', content: listing });
    }
  }
  return sections;
}

/**
 * Find corresponding test files for changed files.
 * @param {string[]} changedFiles
 * @param {string} cwd
 * @param {number} maxChars
 * @returns {Promise<Array<{title: string, content: string}>>}
 */
async function collectTestFiles(changedFiles, cwd, maxChars) {
  const sections = [];
  const seen = new Set();

  for (const filePath of changedFiles) {
    const absPath = path.resolve(cwd, filePath);
    const dir = path.dirname(absPath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);

    // Candidate patterns: *.test.*, *.spec.*
    const candidates = [
      path.join(dir, `${base}.test${ext}`),
      path.join(dir, `${base}.spec${ext}`),
      path.join(dir, `${base}.test.js`),
      path.join(dir, `${base}.spec.js`),
      path.join(dir, `${base}.test.mjs`),
      path.join(dir, `${base}.spec.mjs`),
      path.join(dir, `${base}.test.ts`),
      path.join(dir, `${base}.spec.ts`),
      // __tests__ directory
      path.join(dir, '__tests__', `${base}${ext}`),
      path.join(dir, '__tests__', `${base}.test${ext}`),
      path.join(dir, '__tests__', `${base}.spec${ext}`),
    ];

    for (const candidate of candidates) {
      if (seen.has(candidate)) continue;
      const content = await safeReadFile(candidate);
      if (content !== null) {
        seen.add(candidate);
        const relPath = path.relative(cwd, candidate);
        const truncated =
          content.length > maxChars ? content.slice(0, maxChars) + '\n...[truncated]' : content;
        sections.push({ title: `Test: ${relPath}`, content: truncated });
        break; // first match per file is enough
      }
    }
  }
  return sections;
}

/**
 * Search for export symbol usages using ripgrep.
 * @param {string[]} changedFiles
 * @param {string} cwd
 * @param {number} maxChars
 * @param {string[]} debugMessages
 * @returns {Promise<Array<{title: string, content: string}>>}
 */
async function collectSymbolUsages(changedFiles, cwd, maxChars, debugMessages) {
  // Check if rg is available
  try {
    await execFileAsync('rg', ['--version'], { timeout: 5000 });
  } catch {
    debugMessages.push('symbol-search: ripgrep (rg) not available, skipping');
    return [];
  }

  const sections = [];

  for (const filePath of changedFiles) {
    const absPath = path.resolve(cwd, filePath);
    const content = await safeReadFile(absPath);
    if (!content) continue;

    // Extract exported symbol names
    const exportMatches = [
      ...content.matchAll(/^export\s+(?:async\s+)?(?:function|class|const|let|var)\s+(\w+)/gm),
      ...content.matchAll(/^export\s*\{\s*([^}]+)\}/gm),
      ...content.matchAll(/^module\.exports\s*=\s*\{\s*([^}]+)\}/gm),
    ];

    const symbols = new Set();
    for (const m of exportMatches) {
      // For named exports like `export { foo, bar }`, split on commas
      const names = m[1]
        .split(',')
        .map((s) => s.trim().split(/\s+/)[0])
        .filter(Boolean);
      for (const name of names) symbols.add(name);
    }

    if (!symbols.size) continue;

    // Search for usages (limit to first 3 symbols to avoid excessive output)
    const topSymbols = [...symbols].slice(0, 3);
    for (const symbol of topSymbols) {
      try {
        const { stdout } = await execFileAsync(
          'rg',
          ['--with-filename', '--line-number', '--max-count=10', symbol, cwd],
          { timeout: 10000 }
        );
        if (stdout.trim()) {
          const truncated =
            stdout.length > maxChars ? stdout.slice(0, maxChars) + '\n...[truncated]' : stdout;
          sections.push({
            title: `Symbol usages: ${symbol} (from ${filePath})`,
            content: truncated,
          });
        }
      } catch {
        // rg exits non-zero when no matches found — that is fine
      }
    }
  }

  return sections;
}

/**
 * Collect i18n files matching common patterns.
 * @param {string} cwd
 * @param {number} maxChars
 * @returns {Promise<Array<{title: string, content: string}>>}
 */
async function collectI18nFiles(cwd, maxChars) {
  const dirNames = ['i18n', 'locales'];
  const sections = [];
  const seen = new Set();

  for (const dirName of dirNames) {
    let entries;
    try {
      entries = await fs.readdir(cwd, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name !== dirName) continue;

      const dirPath = path.join(cwd, entry.name);
      let files;
      try {
        files = await fs.readdir(dirPath, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const file of files.slice(0, 3)) {
        if (!file.isFile()) continue;
        const filePath = path.join(dirPath, file.name);
        if (seen.has(filePath)) continue;
        seen.add(filePath);
        const content = await safeReadFile(filePath);
        if (content === null) continue;
        const relPath = path.relative(cwd, filePath);
        const truncated =
          content.length > maxChars ? content.slice(0, maxChars) + '\n...[truncated]' : content;
        sections.push({ title: `i18n: ${relPath}`, content: truncated });
        if (sections.length >= 3) return sections;
      }
    }
  }

  return sections;
}

/**
 * Collect relevant config files from cwd root.
 * @param {string} cwd
 * @param {number} maxChars
 * @returns {Promise<Array<{title: string, content: string}>>}
 */
async function collectConfigFiles(cwd, maxChars) {
  const sections = [];
  for (const basename of CONFIG_BASENAMES) {
    const filePath = path.join(cwd, basename);
    const content = await safeReadFile(filePath);
    if (content === null) continue;
    const truncated =
      content.length > maxChars ? content.slice(0, maxChars) + '\n...[truncated]' : content;
    sections.push({ title: `Config: ${basename}`, content: truncated });
  }
  return sections;
}

/**
 * Collect ADR / architecture docs by keyword matching.
 * @param {string[]} changedFiles
 * @param {string} cwd
 * @param {number} maxChars
 * @returns {Promise<Array<{title: string, content: string}>>}
 */
async function collectAdrDocs(changedFiles, cwd, maxChars) {
  // Build keyword set from changed file paths
  const keywords = new Set();
  for (const f of changedFiles) {
    const parts = f.split('/');
    for (const part of parts) {
      const base = path.basename(part, path.extname(part));
      if (base.length >= 3) keywords.add(base.toLowerCase());
    }
  }

  if (!keywords.size) return [];

  // Find .md files under well-known doc dirs
  const searchDirs = ['docs', 'adr', 'architecture', 'decisions', '.'];
  const sections = [];
  const seen = new Set();

  for (const dir of searchDirs) {
    const dirPath = path.resolve(cwd, dir);
    let entries;
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const filePath = path.join(dirPath, entry.name);
      if (seen.has(filePath)) continue;
      seen.add(filePath);

      const content = await safeReadFile(filePath);
      if (!content) continue;

      const contentLower = content.toLowerCase();
      const matched = [...keywords].some((kw) => contentLower.includes(kw));
      if (!matched) continue;

      const relPath = path.relative(cwd, filePath);
      const truncated =
        content.length > maxChars ? content.slice(0, maxChars) + '\n...[truncated]' : content;
      sections.push({ title: `Doc: ${relPath}`, content: truncated });
      if (sections.length >= 3) return sections;
    }
  }
  return sections;
}

/**
 * Collect repo-wide context for the given changed files.
 *
 * @param {object} options
 * @param {string[]} options.changedFiles - Changed file paths (relative to cwd)
 * @param {string} options.cwd - Repository root path
 * @param {object} [options.tokenBudget] - Per-section character limit overrides
 * @returns {Promise<{sections: Array<{title: string, content: string}>, truncated: boolean, debugSummary: string}>}
 */
export async function collectRepoContext({ changedFiles, cwd, tokenBudget = {} } = {}) {
  const budget = { ...DEFAULT_BUDGET, ...tokenBudget };
  const debugMessages = [];
  const allSections = [];

  if (!changedFiles?.length || !cwd) {
    return {
      sections: [],
      truncated: false,
      debugSummary: 'collectRepoContext: no changedFiles or cwd provided',
    };
  }

  // 1. Changed file full text
  const fullTexts = await collectFullTexts(changedFiles, cwd, budget.fullFile);
  allSections.push(...fullTexts);
  debugMessages.push(`full-text: ${fullTexts.length} file(s)`);

  // 2. Sibling files (listing only — no content to save budget)
  const siblings = await collectSiblingFiles(changedFiles, cwd);
  allSections.push(...siblings);
  debugMessages.push(`siblings: ${siblings.length} section(s)`);

  // 3. Corresponding test files
  const testFiles = await collectTestFiles(changedFiles, cwd, budget.tests);
  allSections.push(...testFiles);
  debugMessages.push(`tests: ${testFiles.length} file(s)`);

  // 4. Symbol usage search via rg
  const usages = await collectSymbolUsages(changedFiles, cwd, budget.usages, debugMessages);
  allSections.push(...usages);

  // 5. i18n files
  const i18nFiles = await collectI18nFiles(cwd, budget.i18n);
  allSections.push(...i18nFiles);
  debugMessages.push(`i18n: ${i18nFiles.length} file(s)`);

  // 6. Config files
  const configFiles = await collectConfigFiles(cwd, budget.config);
  allSections.push(...configFiles);
  debugMessages.push(`config: ${configFiles.length} file(s)`);

  // 7. ADR / architecture docs
  const adrDocs = await collectAdrDocs(changedFiles, cwd, budget.docs);
  allSections.push(...adrDocs);
  debugMessages.push(`docs: ${adrDocs.length} file(s)`);

  // Apply total budget
  let totalChars = allSections.reduce((sum, s) => sum + s.title.length + s.content.length, 0);
  let truncated = false;

  if (totalChars > TOTAL_BUDGET) {
    truncated = true;
    debugMessages.push(
      `total budget exceeded (${totalChars} > ${TOTAL_BUDGET}), truncating sections`
    );
    let remaining = TOTAL_BUDGET;
    for (const section of allSections) {
      const available = Math.max(0, remaining - section.title.length - 10);
      if (section.content.length > available) {
        section.content = section.content.slice(0, available) + '\n...[truncated]';
      }
      remaining -= section.title.length + section.content.length;
      if (remaining <= 0) {
        const idx = allSections.indexOf(section);
        for (let i = idx + 1; i < allSections.length; i++) {
          allSections[i].content = '...[omitted due to total budget]';
        }
        break;
      }
    }
    totalChars = allSections.reduce((sum, s) => sum + s.title.length + s.content.length, 0);
    debugMessages.push(`after truncation: ${totalChars} chars`);
  }

  return {
    sections: allSections,
    truncated,
    debugSummary: debugMessages.join('; '),
  };
}

/**
 * Format collected context sections into a prompt string.
 *
 * @param {Array<{title: string, content: string}>} sections
 * @returns {string}
 */
export function formatRepoContextPrompt(sections) {
  if (!sections?.length) return '';
  const parts = ['### Repository Context\n'];
  for (const section of sections) {
    parts.push(`#### ${section.title}`);
    if (section.content) {
      parts.push('```');
      parts.push(section.content);
      parts.push('```');
    }
    parts.push('');
  }
  return parts.join('\n');
}
