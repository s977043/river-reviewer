// Secret redaction for repo-wide review context (#692 PR-A).
//
// This module is **additive** and not yet wired into the review pipeline.
// PR-C of #692 will hook it into src/lib/repo-context.mjs and
// src/lib/local-runner.mjs so that prompt input and debug artifacts are
// redacted before they leave process memory.
//
// Design notes (see Issue #692 plan):
// - Replacements are *length-independent* (`<REDACTED:category>`) so that
//   suppression fingerprints stay stable when redaction is toggled on/off
//   (interaction with #687 PR-B applySuppressions).
// - High-entropy detection is opt-in by config and runs LAST so that named
//   categories take priority and avoid double-counting.
// - Allowlist substrings (example, dummy, placeholder, missing, xxxxx)
//   suppress redaction on the surrounding token to protect documentation
//   examples and obvious test fixtures from being mangled.
// - DEFAULT_DENY_GLOBS is exported separately so that path-level exclusion
//   can run BEFORE redaction (avoids reading .env / *.pem files at all).

import { minimatch } from 'minimatch';

/**
 * Path globs that must be excluded from repo-wide context regardless of
 * user config. Lock files and build artifacts are also denied because they
 * carry no review value but inflate the budget.
 */
export const DEFAULT_DENY_GLOBS = Object.freeze([
  '**/.env',
  '**/.env.*',
  '**/.envrc',
  '**/secrets.*',
  '**/credentials.*',
  '**/credentials/**',
  '**/*.pem',
  '**/*.key',
  '**/*.p12',
  '**/*.pfx',
  '**/*.jks',
  '**/*.keystore',
  '**/id_rsa',
  '**/id_dsa',
  '**/id_ecdsa',
  '**/id_ed25519',
  '**/*.lock',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/yarn.lock',
  '**/composer.lock',
  '**/Cargo.lock',
  '**/poetry.lock',
  '**/Gemfile.lock',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/.next/**',
  '**/coverage/**',
  '**/*.min.js',
  '**/*.min.css',
  '**/*.map',
]);

/**
 * Substrings that, when found near a candidate match, mark the match as a
 * documentation example or test placeholder rather than a real secret.
 *
 * `xxxxx` was rejected as too aggressive: legitimate hex / base64 tokens
 * frequently contain runs of repeated characters and would be incorrectly
 * skipped. The high-entropy fallback already protects monotonic strings
 * (entropy below threshold) so the placeholder list is intentionally short.
 */
const ALLOWLIST_TOKENS = Object.freeze([
  'example',
  'dummy',
  'placeholder',
  '<missing>',
]);

const ALLOWLIST_RE = new RegExp(
  ALLOWLIST_TOKENS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

const REPLACEMENT = (category) => `<REDACTED:${category}>`;

/**
 * Pattern categories. Order matters — more specific / longer alternatives
 * come first so they win over weaker patterns and don't get partly eaten by
 * the high-entropy fallback.
 *
 * Each entry: { id, regex, replacement?, requireValueShape? }.
 */
const PATTERNS = [
  // GitHub
  { id: 'githubToken', regex: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/g },
  { id: 'githubToken', regex: /\bgithub_pat_[A-Za-z0-9_]{82}\b/g },
  // OpenAI / Anthropic / Google
  { id: 'openaiKey', regex: /\bsk-proj-[A-Za-z0-9_-]{40,}\b/g },
  { id: 'anthropicKey', regex: /\bsk-ant-[A-Za-z0-9_-]{40,}\b/g },
  { id: 'openaiKey', regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { id: 'googleApiKey', regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  // AWS
  { id: 'awsAccessKey', regex: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g },
  // Long-form private keys (multi-line block)
  {
    id: 'privateKey',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED |PGP |)PRIVATE KEY-----[\s\S]*?-----END[^-]*PRIVATE KEY-----/g,
  },
  // Bearer tokens — capture the surrounding "Bearer " keyword to limit FP
  { id: 'bearerToken', regex: /\b[Bb]earer\s+[A-Za-z0-9._~+/=-]{20,}\b/g },
  // Database connection strings
  {
    id: 'databaseUrl',
    regex: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp|mssql):\/\/[^\s'"`<>]+/g,
  },
  // Webhook URLs (Slack / Discord)
  { id: 'webhookUrl', regex: /https:\/\/hooks\.slack\.com\/[A-Z0-9/]+/g },
  { id: 'webhookUrl', regex: /https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/g },
];

/**
 * Patterns that are case-insensitive *value-shape* patterns and require an
 * explicit assignment context (key=value). These run after the explicit
 * patterns above so a literal `aws_secret_access_key=...` does not get
 * partially consumed.
 */
const ASSIGNMENT_PATTERNS = [
  // aws_secret_access_key = "..."
  {
    id: 'awsSecretKey',
    regex: /\baws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}['"]?/gi,
  },
  // client_secret = "...", consumer_secret = "..."
  {
    id: 'oauthSecret',
    regex: /\b(?:client|consumer)[_-]?secret\s*[:=]\s*['"][^'"]{16,}['"]/gi,
  },
];

/**
 * Variable-name based assignment redaction. Only redacts values when the
 * name itself implies a secret, so plain dotenv lines like `PORT=3000` or
 * `LOG_LEVEL=info` are left alone.
 */
const ENV_VAR_RE =
  /^([ \t]*[A-Z][A-Z0-9_]{2,}_(?:TOKEN|SECRET|KEY|PASSWORD|PASSWD|CREDENTIAL|CREDENTIALS|API_KEY|ACCESS_KEY|PRIVATE_KEY))\s*=\s*(.+)$/gm;

const MIN_HIGH_ENTROPY_LENGTH = 24;
const DEFAULT_HIGH_ENTROPY_THRESHOLD = 4.5;
const HIGH_ENTROPY_TOKEN_RE = /[A-Za-z0-9+/=_-]{24,}/g;

/**
 * Shannon entropy in bits per character. Higher = more random.
 * @param {string} s
 */
export function shannonEntropy(s) {
  if (!s) return 0;
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  const len = s.length;
  let h = 0;
  for (const c of counts.values()) {
    const p = c / len;
    h -= p * Math.log2(p);
  }
  return h;
}

function isAllowlisted(snippet) {
  return ALLOWLIST_RE.test(snippet);
}

/**
 * Redact secrets in a text string.
 *
 * @param {string} text
 * @param {object} [opts]
 * @param {boolean} [opts.highEntropy] enable Shannon-entropy fallback (default true)
 * @param {number} [opts.entropyThreshold] entropy bits/char threshold (default 4.5)
 * @param {string[]} [opts.allowlist] additional substrings that suppress redaction
 * @returns {{ text: string, hits: Array<{ category: string, count: number }> }}
 */
export function redactText(text, opts = {}) {
  if (text == null || text === '') return { text: text ?? '', hits: [] };
  const {
    highEntropy = true,
    entropyThreshold = DEFAULT_HIGH_ENTROPY_THRESHOLD,
    allowlist = [],
  } = opts;
  const extraAllow = allowlist.length
    ? new RegExp(allowlist.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i')
    : null;

  const hits = new Map();
  const bump = (category, n = 1) => hits.set(category, (hits.get(category) || 0) + n);
  const skipMatch = (full) =>
    isAllowlisted(full) || (extraAllow ? extraAllow.test(full) : false);

  let out = String(text);

  for (const { id, regex } of PATTERNS) {
    out = out.replace(regex, (m) => {
      if (skipMatch(m)) return m;
      bump(id);
      return REPLACEMENT(id);
    });
  }

  for (const { id, regex } of ASSIGNMENT_PATTERNS) {
    out = out.replace(regex, (m) => {
      if (skipMatch(m)) return m;
      bump(id);
      return REPLACEMENT(id);
    });
  }

  out = out.replace(ENV_VAR_RE, (full, name, value) => {
    if (skipMatch(full)) return full;
    if (!value || value.trim().length < 8) return full;
    bump('envAssignment');
    return `${name}=${REPLACEMENT('envAssignment')}`;
  });

  if (highEntropy) {
    out = out.replace(HIGH_ENTROPY_TOKEN_RE, (m) => {
      if (m.length < MIN_HIGH_ENTROPY_LENGTH) return m;
      if (skipMatch(m)) return m;
      // Skip tokens that are still mid-replacement (we already redacted nearby).
      if (m.includes('REDACTED')) return m;
      const h = shannonEntropy(m);
      if (h < entropyThreshold) return m;
      bump('highEntropy');
      return REPLACEMENT('highEntropy');
    });
  }

  return {
    text: out,
    hits: [...hits.entries()].map(([category, count]) => ({ category, count })),
  };
}

/**
 * True when `relPath` should be excluded from repo-wide context.
 * Combines the built-in deny list with caller-supplied additions, then
 * applies an allowlist of explicit "force-include" globs.
 *
 * @param {string} relPath
 * @param {object} [opts]
 * @param {string[]} [opts.extraDenyGlobs]
 * @param {string[]} [opts.allowlist] globs that override deny matches
 * @returns {boolean}
 */
export function shouldExcludeForContext(relPath, opts = {}) {
  if (!relPath) return false;
  const { extraDenyGlobs = [], allowlist = [] } = opts;
  const deny = [...DEFAULT_DENY_GLOBS, ...extraDenyGlobs];

  const matchOpts = { dot: true, nocase: false, matchBase: false };
  // Allowlist beats deny so users can opt back into specific paths if they
  // truly need them (e.g., a sample .env they want reviewed).
  for (const g of allowlist) {
    if (minimatch(relPath, g, matchOpts)) return false;
  }
  for (const g of deny) {
    if (minimatch(relPath, g, matchOpts)) return true;
  }
  return false;
}
