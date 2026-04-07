/**
 * Classify changed files by type for routing and evidence collection.
 * Complementary to impact-scope.mjs which classifies by quality domain.
 *
 * @param {string[]} files - Array of file paths (relative to repo root)
 * @returns {{ config: string[], schema: string[], migration: string[], app: string[], test: string[], infra: string[], docs: string[], unknown: string[] }}
 */
export function classifyChangedFiles(files) {
  const result = {
    config: [],
    schema: [],
    migration: [],
    app: [],
    test: [],
    infra: [],
    docs: [],
    unknown: [],
  };

  for (const file of files) {
    result[classifyFile(file)].push(file);
  }

  return result;
}

// Priority: test > schema > migration > config > infra > docs > app > unknown
function classifyFile(file) {
  const normalized = file.replaceAll('\\', '/');
  const basename = normalized.split('/').pop() ?? '';

  if (isTest(normalized, basename)) return 'test';
  if (isSchema(normalized, basename)) return 'schema';
  if (isMigration(normalized)) return 'migration';
  if (isConfig(normalized, basename)) return 'config';
  if (isInfra(normalized)) return 'infra';
  if (isDocs(normalized, basename)) return 'docs';
  if (isApp(normalized)) return 'app';
  return 'unknown';
}

function isTest(file, basename) {
  return (
    file.startsWith('tests/') ||
    file.includes('/__tests__/') ||
    /\.(?:test|spec)\.[jt]sx?$/.test(basename) ||
    /\.(?:test|spec)\.mjs$/.test(basename)
  );
}

function isSchema(file, basename) {
  return (
    file.startsWith('schemas/') ||
    /\.schema\.[jt]s$/.test(basename) ||
    basename.endsWith('.schema.json')
  );
}

function isMigration(file) {
  return (
    /(?:^|\/)migrations?\//.test(file) || /(?:^|\/)migrate/.test(file) || file.startsWith('db/')
  );
}

function isConfig(file, basename) {
  if (/\.config\.[jt]sx?$/.test(basename) || /\.config\.mjs$/.test(basename)) return true;
  if (/^\.[a-z]+rc(?:\.[a-z]+)?$/.test(basename)) return true;
  const configNames = [
    'package.json',
    '.env',
    '.river-reviewer.json',
    '.lychee.toml',
    '.markdownlint.json',
    '.markdownlint-cli2.yaml',
    '.textlintrc.json',
  ];
  if (configNames.some((c) => basename === c || basename.startsWith('.env'))) return true;
  if (/^tsconfig.*\.json$/.test(basename)) return true;
  return false;
}

function isInfra(file) {
  return (
    file.startsWith('.github/') ||
    file.startsWith('.husky/') ||
    file.startsWith('scripts/') ||
    /^Dockerfile/.test(file.split('/').pop() ?? '') ||
    /^docker-compose/.test(file.split('/').pop() ?? '')
  );
}

function isDocs(file, basename) {
  if (basename.endsWith('.md') || basename.endsWith('.mdx')) return true;
  if (file.startsWith('docs/') || file.startsWith('pages/')) return true;
  return false;
}

function isApp(file) {
  return file.startsWith('src/') || file.startsWith('runners/');
}
