/**
 * Repo-wide context collector for River Reviewer.
 * Gathers full file text, corresponding tests, symbol usages, and config
 * snippets relevant to the changed files, within a configurable token budget.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

import { redactText, shouldExcludeForContext } from './secret-redactor.mjs';

const execFileAsync = promisify(execFile);

/** Maximum total characters of repo context injected into the prompt. */
const DEFAULT_MAX_CHARS = 8000;

/** Per-section character caps (applied before the global budget). */
const SECTION_CAPS = {
  fullFile: 3000,
  tests: 2000,
  usages: 1500,
  config: 500,
};

/** Test file path heuristics. */
const TEST_SUFFIXES = [
  (f) => f.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '.test.$1'),
  (f) => f.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '.spec.$1'),
  (f) => f.replace(/src\//, 'tests/').replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '.test.$1'),
  (f) => {
    const base = path.basename(f);
    const dir = path.dirname(f);
    return path.join(dir, '__tests__', base.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '.test.$1'));
  },
];

/** Config files to include a snippet of. */
const CONFIG_GLOBS = [
  'tsconfig.json',
  'package.json',
  'next.config.*',
  '.eslintrc*',
  'vite.config.*',
];

/**
 * Collect repo-wide context relevant to the changed files.
 *
 * @param {object} opts
 * @param {string[]} opts.changedFiles - Relative paths of changed files
 * @param {string} opts.repoRoot - Absolute path to the repository root
 * @param {number} [opts.maxChars] - Total character budget (default 8000)
 * @param {object} [opts.security] - `config.security` block (#692). When omitted,
 *   redaction defaults are used and `shouldExcludeForContext` runs against
 *   `DEFAULT_DENY_GLOBS` only.
 * @returns {Promise<RepoContext>}
 */
export async function collectRepoContext({
  changedFiles,
  repoRoot,
  maxChars = DEFAULT_MAX_CHARS,
  security,
}) {
  const sections = [];
  let budget = maxChars;

  // #692 PR-C: redaction & path-level deny.
  // - shouldExcludeForContext runs BEFORE we even read a file so dotenv,
  //   pem keys, lock files, build artifacts never enter process memory.
  // - redactText runs AFTER reading so any secret that slipped past the
  //   path filter (e.g. an inline AWS key in a regular .ts file) is masked
  //   before being injected into the prompt.
  // The tally feeds debug output via redactionHits below.
  const redactCfg = security?.redact;
  const redactionEnabled = redactCfg?.enabled !== false; // default true
  const denyExtra = Array.isArray(redactCfg?.denyFiles) ? redactCfg.denyFiles : [];
  const allowExtra = Array.isArray(redactCfg?.allowlist) ? redactCfg.allowlist : [];
  const redactOpts = redactionEnabled
    ? {
        allowlist: allowExtra,
        ...(redactCfg?.entropyThreshold != null
          ? { entropyThreshold: redactCfg.entropyThreshold }
          : {}),
        ...(redactCfg?.categories?.highEntropy === false ? { highEntropy: false } : {}),
      }
    : null;
  const totalHits = new Map();
  const excludedPaths = [];
  const bumpHits = (hits) => {
    for (const { category, count } of hits) {
      totalHits.set(category, (totalHits.get(category) || 0) + count);
    }
  };
  const isPathExcluded = (rel) =>
    shouldExcludeForContext(rel, { extraDenyGlobs: denyExtra, allowlist: allowExtra });
  const maybeRedact = (text) => {
    if (!redactionEnabled || !text) return text;
    const { text: redacted, hits } = redactText(text, redactOpts);
    if (hits.length) bumpHits(hits);
    return redacted;
  };

  // 1. Full text of changed source files
  for (const rel of changedFiles.slice(0, 5)) {
    if (budget <= 0) break;
    if (isPathExcluded(rel)) {
      excludedPaths.push({ path: rel, section: 'fullFile' });
      continue;
    }
    const abs = path.join(repoRoot, rel);
    if (!isSourceFile(rel) || !fileExists(abs)) continue;
    const raw = readFileCapped(abs, Math.min(SECTION_CAPS.fullFile, budget));
    if (raw) {
      const content = maybeRedact(raw);
      sections.push({ label: `Full file: ${rel}`, content, file: rel });
      budget -= content.length;
    }
  }

  // 2. Corresponding test files
  const testContents = [];
  for (const rel of changedFiles.slice(0, 5)) {
    if (budget <= 0) break;
    for (const toTest of TEST_SUFFIXES) {
      const candidate = toTest(rel);
      if (isPathExcluded(candidate)) {
        excludedPaths.push({ path: candidate, section: 'tests' });
        break;
      }
      const abs = path.join(repoRoot, candidate);
      if (fileExists(abs)) {
        const raw = readFileCapped(abs, Math.min(SECTION_CAPS.tests, budget));
        if (raw) {
          const content = maybeRedact(raw);
          testContents.push(`// ${candidate}\n${content}`);
          budget -= content.length;
        }
        break;
      }
    }
  }
  if (testContents.length) {
    sections.push({
      label: 'Corresponding test files',
      content: testContents.join('\n\n'),
      file: null,
    });
  }

  // 3. Symbol usage search via ripgrep
  if (budget > 0) {
    const exportedSymbols = extractExportedSymbols({ changedFiles, repoRoot });
    if (exportedSymbols.length) {
      const usages = await searchSymbolUsages({
        symbols: exportedSymbols.slice(0, 5),
        repoRoot,
        excludeFiles: changedFiles,
        maxChars: Math.min(SECTION_CAPS.usages, budget),
      });
      if (usages) {
        const content = maybeRedact(usages);
        sections.push({ label: 'Symbol usage references', content, file: null });
        budget -= content.length;
      }
    }
  }

  // 4. Config snippets
  if (budget > 0) {
    const configSnippets = [];
    for (const glob of CONFIG_GLOBS) {
      if (isPathExcluded(glob)) {
        excludedPaths.push({ path: glob, section: 'config' });
        continue;
      }
      const abs = path.join(repoRoot, glob);
      if (fileExists(abs)) {
        const snippet = readFileCapped(
          abs,
          Math.min(SECTION_CAPS.config, budget - configSnippets.reduce((s, c) => s + c.length, 0))
        );
        if (snippet) configSnippets.push(`// ${glob}\n${maybeRedact(snippet)}`);
      }
    }
    if (configSnippets.length) {
      const content = configSnippets.join('\n\n');
      sections.push({ label: 'Config files', content, file: null });
      budget -= content.length;
    }
  }

  const redactionHits = [...totalHits.entries()].map(([category, count]) => ({ category, count }));

  return {
    sections,
    totalChars: maxChars - budget,
    truncated: budget <= 0,
    redactionHits,
    excludedPaths,
  };
}

/**
 * Build the "Repository Context" section string for prompt injection.
 * Returns empty string when no context is available.
 *
 * @param {RepoContext|null|undefined} repoContext
 * @returns {string}
 */
export function buildRepoContextSection(repoContext) {
  if (!repoContext?.sections?.length) return '';
  const parts = ['\n### Repository Context\n'];
  parts.push('差分の外側にある関連コードです。cross-file の影響分析に使用してください。\n');
  for (const sec of repoContext.sections) {
    parts.push(`#### ${sec.label}\n\`\`\`\n${sec.content}\n\`\`\`\n`);
  }
  if (repoContext.truncated) {
    parts.push('> _Repository context was truncated to fit the prompt budget._\n');
  }
  return parts.join('\n');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isSourceFile(rel) {
  return /\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte|py|rb|go|java|kt|swift)$/.test(rel);
}

function fileExists(abs) {
  try {
    return fs.statSync(abs).isFile();
  } catch {
    return false;
  }
}

function readFileCapped(abs, cap) {
  try {
    const raw = fs.readFileSync(abs, 'utf8');
    if (!raw.trim()) return null;
    return raw.length > cap ? raw.slice(0, cap) + '\n// ...[truncated]' : raw;
  } catch {
    return null;
  }
}

function extractExportedSymbols({ changedFiles, repoRoot }) {
  const symbols = [];
  const exportRe = /^export\s+(?:(?:async\s+)?function|class|const|let|var)\s+(\w+)/gm;
  for (const rel of changedFiles.slice(0, 5)) {
    const abs = path.join(repoRoot, rel);
    if (!isSourceFile(rel) || !fileExists(abs)) continue;
    try {
      const text = fs.readFileSync(abs, 'utf8');
      for (const m of text.matchAll(exportRe)) {
        if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
      }
    } catch {
      // skip
    }
  }
  return symbols;
}

async function searchSymbolUsages({ symbols, repoRoot, excludeFiles, maxChars }) {
  if (!symbols.length) return null;
  const pattern = symbols.map((s) => `\\b${s}\\b`).join('|');
  const excludeArgs = excludeFiles.flatMap((f) => ['--iglob', `!${f}`]);
  try {
    const { stdout } = await execFileAsync(
      'rg',
      [
        '--no-heading',
        '--line-number',
        '--max-count',
        '3',
        '--max-filesize',
        '200K',
        '--glob',
        '*.{ts,tsx,js,jsx,mjs,cjs}',
        ...excludeArgs,
        '-e',
        pattern,
        '.',
      ],
      { cwd: repoRoot, timeout: 5000 }
    );
    const trimmed = stdout.slice(0, maxChars);
    return trimmed || null;
  } catch {
    return null;
  }
}

/**
 * @typedef {object} RepoContext
 * @property {Array<{label: string, content: string, file: string|null}>} sections
 * @property {number} totalChars
 * @property {boolean} truncated
 */
