import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const DEFAULT_MAX_FILE_CHARS = 8000;
const DEFAULT_MAX_CONTEXT_CHARS = 24000;
const DEFAULT_MAX_SECTIONS = 40;
const DEFAULT_MAX_SYMBOLS = 20;
const DEFAULT_MAX_SEARCH_RESULTS = 20;

const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.pdf',
  '.zip',
  '.gz',
  '.tgz',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.mp4',
  '.mov',
  '.wasm',
]);

const CONFIG_CANDIDATES = [
  'package.json',
  'tsconfig.json',
  'jsconfig.json',
  'next.config.js',
  'next.config.mjs',
  'vite.config.ts',
  'eslint.config.js',
  '.eslintrc.json',
  '.river/rules.md',
  '.river/risk-map.yaml',
];

function normalizeRepoPath(filePath) {
  return String(filePath || '').replaceAll('\\\\', '/').replace(/^\.\//, '');
}

function isSafeRelativePath(filePath) {
  const normalized = normalizeRepoPath(filePath);
  return Boolean(normalized) && !normalized.startsWith('../') && !path.isAbsolute(normalized);
}

export function isLikelyTextPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return !BINARY_EXTENSIONS.has(ext);
}

async function readTextSafe(repoRoot, relativePath, { maxChars = DEFAULT_MAX_FILE_CHARS } = {}) {
  if (!isSafeRelativePath(relativePath) || !isLikelyTextPath(relativePath)) return null;

  const absolutePath = path.resolve(repoRoot, relativePath);
  const repoRootAbs = path.resolve(repoRoot);
  if (!absolutePath.startsWith(repoRootAbs + path.sep) && absolutePath !== repoRootAbs) return null;

  try {
    const text = await fs.readFile(absolutePath, 'utf8');
    const truncated = text.length > maxChars;
    return {
      path: normalizeRepoPath(relativePath),
      content: truncated ? `${text.slice(0, maxChars)}\n...[truncated]` : text,
      truncated,
    };
  } catch {
    return null;
  }
}

export function candidateTestPaths(filePath) {
  const normalized = normalizeRepoPath(filePath);
  const ext = path.extname(normalized);
  if (!ext) return [];

  const dir = path.posix.dirname(normalized);
  const base = path.posix.basename(normalized, ext);
  const candidates = [
    path.posix.join(dir, `${base}.test${ext}`),
    path.posix.join(dir, `${base}.spec${ext}`),
    path.posix.join(dir, '__tests__', `${base}.test${ext}`),
    path.posix.join(dir, '__tests__', `${base}.spec${ext}`),
  ];

  if (dir.startsWith('src/')) {
    const withoutSrc = normalized.slice('src/'.length);
    const testDir = path.posix.dirname(withoutSrc);
    const testBase = path.posix.basename(withoutSrc, ext);
    candidates.push(
      path.posix.join('tests', testDir, `${testBase}.test${ext}`),
      path.posix.join('tests', testDir, `${testBase}.spec${ext}`)
    );
  }

  return [...new Set(candidates)].filter((candidate) => candidate !== normalized);
}

export function extractCandidateSymbols(diffText, { maxSymbols = DEFAULT_MAX_SYMBOLS } = {}) {
  if (!diffText) return [];

  const symbols = new Set();
  const patterns = [
    /\bexport\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /\bexport\s+const\s+([A-Za-z_$][\w$]*)/g,
    /\bexport\s+class\s+([A-Za-z_$][\w$]*)/g,
    /\bfunction\s+([A-Za-z_$][\w$]*)/g,
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=/g,
    /\bclass\s+([A-Za-z_$][\w$]*)/g,
  ];

  for (const pattern of patterns) {
    for (const match of diffText.matchAll(pattern)) {
      const symbol = match[1];
      if (symbol && symbol.length >= 3) symbols.add(symbol);
      if (symbols.size >= maxSymbols) return [...symbols];
    }
  }

  return [...symbols];
}

async function defaultSearchImpl(repoRoot, symbol, { maxResults = DEFAULT_MAX_SEARCH_RESULTS } = {}) {
  try {
    const { stdout } = await execFileAsync(
      'rg',
      [
        '--line-number',
        '--hidden',
        '--glob',
        '!node_modules',
        '--glob',
        '!.git',
        '--glob',
        '!dist',
        `\\b${symbol}\\b`,
        repoRoot,
      ],
      { maxBuffer: 1024 * 1024 }
    );
    return stdout.split('\n').filter(Boolean).slice(0, maxResults);
  } catch {
    return [];
  }
}

function addSection(sections, section, maxSections) {
  if (!section?.content || sections.length >= maxSections) return;
  sections.push(section);
}

export async function collectRepoContext({
  repoRoot,
  changedFiles = [],
  diffText = '',
  maxFileChars = DEFAULT_MAX_FILE_CHARS,
  maxSections = DEFAULT_MAX_SECTIONS,
  searchImpl = defaultSearchImpl,
} = {}) {
  if (!repoRoot) throw new Error('collectRepoContext requires repoRoot');

  const sections = [];
  const normalizedFiles = [...new Set(changedFiles.map(normalizeRepoPath).filter(Boolean))];

  for (const file of normalizedFiles) {
    const fullFile = await readTextSafe(repoRoot, file, { maxChars: maxFileChars });
    if (fullFile) {
      addSection(
        sections,
        {
          type: 'fullFile',
          title: fullFile.path,
          content: fullFile.content,
          truncated: fullFile.truncated,
        },
        maxSections
      );
    }

    for (const testPath of candidateTestPaths(file)) {
      const testFile = await readTextSafe(repoRoot, testPath, { maxChars: maxFileChars });
      if (testFile) {
        addSection(
          sections,
          {
            type: 'testFile',
            title: testFile.path,
            content: testFile.content,
            truncated: testFile.truncated,
          },
          maxSections
        );
      }
    }
  }

  for (const configPath of CONFIG_CANDIDATES) {
    const configFile = await readTextSafe(repoRoot, configPath, { maxChars: Math.min(maxFileChars, 4000) });
    if (configFile) {
      addSection(
        sections,
        {
          type: 'repoConfig',
          title: configFile.path,
          content: configFile.content,
          truncated: configFile.truncated,
        },
        maxSections
      );
    }
  }

  const symbols = extractCandidateSymbols(diffText);
  for (const symbol of symbols) {
    if (sections.length >= maxSections) break;
    const results = await searchImpl(repoRoot, symbol, { maxResults: DEFAULT_MAX_SEARCH_RESULTS });
    if (results?.length) {
      addSection(
        sections,
        {
          type: 'symbolUsage',
          title: symbol,
          content: results.join('\n'),
          truncated: results.length >= DEFAULT_MAX_SEARCH_RESULTS,
        },
        maxSections
      );
    }
  }

  return sections;
}

export function summarizeRepoContext(sections = []) {
  const byType = {};
  let truncated = 0;
  for (const section of sections) {
    byType[section.type] = (byType[section.type] ?? 0) + 1;
    if (section.truncated) truncated += 1;
  }
  return {
    sectionCount: sections.length,
    truncated,
    byType,
  };
}

export function formatRepoContext(sections = [], { maxChars = DEFAULT_MAX_CONTEXT_CHARS } = {}) {
  let output = '';
  let truncated = false;

  for (const section of sections) {
    const block = [
      `\n### ${section.type}: ${section.title}`,
      '```text',
      section.content,
      '```',
    ].join('\n');

    if ((output + block).length > maxChars) {
      truncated = true;
      break;
    }
    output += block;
  }

  if (truncated) output += '\n...[repo context truncated]';
  return output.trim();
}
