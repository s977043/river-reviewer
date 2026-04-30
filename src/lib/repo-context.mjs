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
import { charsToTokens, estimateTokens } from './token-estimator.mjs';
import { DEFAULT_WEIGHTS, pathProximity, scoreContextCandidate } from './context-ranker.mjs';

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
  context: contextConfig,
}) {
  const sections = [];

  // #689 PR-C: optional token budget on top of the legacy char budget.
  // When `config.context.budget.maxTokens` is set, we also gate by an
  // estimated token cost so callers can think in tokens. The char
  // budget remains authoritative for backward compat — both must be
  // satisfied for a candidate to land. estimateTokens is approximate
  // (ASCII chars/4, CJK chars/2 in #689 PR-A) so callers should treat
  // the result as best-effort, not a hard ceiling.
  const budgetCfg = contextConfig?.budget;
  const maxTokensCfg = Number.isFinite(budgetCfg?.maxTokens) ? budgetCfg.maxTokens : null;
  let tokenBudget = maxTokensCfg;
  const billTokens = (text) => {
    if (tokenBudget == null || !text) return;
    tokenBudget -= estimateTokens(text);
  };
  const tokenBudgetExhausted = () => tokenBudget != null && tokenBudget <= 0;

  // #689 PR-C: optional ranking. When `config.context.ranking.enabled`
  // is true (and changedFiles has more than one entry), score each
  // candidate against the rest of the change set and process the most
  // relevant ones first. PR-B (#714) shipped the pure scoring
  // primitives; here we wire the simplest signal — pathProximity — and
  // PR-D will layer in commit recency / risk-map weights.
  const rankingCfg = contextConfig?.ranking;
  const rankingEnabled = rankingCfg?.enabled === true;
  const weights = rankingCfg?.weights ?? DEFAULT_WEIGHTS;
  const rankCandidates = (paths) => {
    if (!rankingEnabled || paths.length <= 1)
      return paths.map((p, i) => ({ path: p, score: 1, originalIndex: i }));
    return paths
      .map((p, i) => {
        // Proximity to the most recently-changed file in the set is a
        // useful first-order signal. The collector picks the highest
        // score across the rest of the change set so the head of the
        // list always has at least one strong neighbor.
        const proximities = paths.filter((_, j) => j !== i).map((other) => pathProximity(p, other));
        const proximity = proximities.length ? Math.max(...proximities) : 0;
        const score = scoreContextCandidate({
          signals: { pathProximity: proximity },
          weights,
        });
        return { path: p, score, originalIndex: i };
      })
      .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex);
  };

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

  // 1. Full text of changed source files.
  // PR-C (#689): rankCandidates orders the change set so the most
  // relevant files (highest pathProximity to the rest of the change
  // set) get processed first under the budget. Without ranking the
  // legacy first-N-files behavior is preserved by handing back the
  // candidates in their original order.
  const rankedFullFile = rankCandidates(changedFiles.slice(0, 5));
  const rankedScores = [];
  for (const { path: rel, score } of rankedFullFile) {
    if (budget <= 0 || tokenBudgetExhausted()) break;
    if (isPathExcluded(rel)) {
      excludedPaths.push({ path: rel, section: 'fullFile' });
      continue;
    }
    const abs = path.join(repoRoot, rel);
    if (!isSourceFile(rel) || !fileExists(abs)) continue;
    // Use the tighter of the char-budget cap and the token-budget cap
    // (translated to chars) so we never read more than either budget
    // allows. PR-A (#712) charsToTokens is the safe upper bound.
    const tokenChars = tokenBudget != null ? Math.max(0, charsToTokens(tokenBudget)) : Infinity;
    const cap = Math.min(SECTION_CAPS.fullFile, budget, tokenChars);
    if (cap <= 0) break;
    const raw = readFileCapped(abs, cap);
    if (raw) {
      const content = maybeRedact(raw);
      sections.push({ label: `Full file: ${rel}`, content, file: rel });
      budget -= content.length;
      billTokens(content);
      rankedScores.push({ path: rel, score });
    }
  }

  // 2. Corresponding test files
  const testContents = [];
  for (const rel of changedFiles.slice(0, 5)) {
    if (budget <= 0 || tokenBudgetExhausted()) break;
    for (const toTest of TEST_SUFFIXES) {
      const candidate = toTest(rel);
      if (isPathExcluded(candidate)) {
        excludedPaths.push({ path: candidate, section: 'tests' });
        break;
      }
      const abs = path.join(repoRoot, candidate);
      if (fileExists(abs)) {
        const tokenChars = tokenBudget != null ? Math.max(0, charsToTokens(tokenBudget)) : Infinity;
        const cap = Math.min(SECTION_CAPS.tests, budget, tokenChars);
        if (cap <= 0) break;
        const raw = readFileCapped(abs, cap);
        if (raw) {
          const content = maybeRedact(raw);
          // The pushed entry includes a `// candidate\n` header; bill the
          // entire entry against the budget so the running total stays
          // accurate when many test files are aggregated.
          const entry = `// ${candidate}\n${content}`;
          testContents.push(entry);
          budget -= entry.length;
          billTokens(entry);
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
  if (budget > 0 && !tokenBudgetExhausted()) {
    const exportedSymbols = extractExportedSymbols({ changedFiles, repoRoot });
    if (exportedSymbols.length) {
      const tokenChars = tokenBudget != null ? Math.max(0, charsToTokens(tokenBudget)) : Infinity;
      const usagesCap = Math.min(SECTION_CAPS.usages, budget, tokenChars);
      if (usagesCap > 0) {
        const usages = await searchSymbolUsages({
          symbols: exportedSymbols.slice(0, 5),
          repoRoot,
          excludeFiles: changedFiles,
          maxChars: usagesCap,
        });
        if (usages) {
          const content = maybeRedact(usages);
          sections.push({ label: 'Symbol usage references', content, file: null });
          budget -= content.length;
          billTokens(content);
        }
      }
    }
  }

  // 4. Config snippets
  if (budget > 0 && !tokenBudgetExhausted()) {
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
      billTokens(content);
    }
  }

  const redactionHits = [...totalHits.entries()].map(([category, count]) => ({ category, count }));

  return {
    sections,
    totalChars: maxChars - budget,
    truncated: budget <= 0 || tokenBudgetExhausted(),
    redactionHits,
    excludedPaths,
    // PR-C (#689): expose ranking + budget telemetry on the result so
    // callers can surface it via reviewDebug. Raw context never appears
    // here — only counts and per-path scores.
    ranking: rankingEnabled
      ? {
          enabled: true,
          scores: rankedScores,
        }
      : null,
    tokenBudget:
      maxTokensCfg != null
        ? {
            max: maxTokensCfg,
            remaining: Math.max(0, tokenBudget),
            exhausted: tokenBudgetExhausted(),
          }
        : null,
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
