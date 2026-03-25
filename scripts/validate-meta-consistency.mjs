import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');

async function readJson(filePath) {
  const raw = await fs.readFile(path.join(ROOT, filePath), 'utf8');
  return JSON.parse(raw);
}

async function readText(filePath) {
  return fs.readFile(path.join(ROOT, filePath), 'utf8');
}

/**
 * Extract all @vX.Y.Z action tag references from text.
 */
export function extractActionTags(text) {
  const matches =
    text.match(/river-reviewer\/runners\/github-action@v[\d.]+/g) || [];
  return [...new Set(matches.map((m) => m.split('@')[1]))];
}

/**
 * Extract "Latest release: [vX.Y.Z]" version from text.
 */
export function extractLatestRelease(text) {
  const match = text.match(
    /(?:最新リリース|Latest release):\s*\[v([\d.]+)\]/,
  );
  return match ? match[1] : null;
}

/**
 * Validate meta-consistency across README and package.json.
 * Returns array of error strings (empty = pass).
 */
export async function validateMeta() {
  const errors = [];

  const pkg = await readJson('package.json');
  const expectedVersion = pkg.version; // e.g. "0.10.0"

  // Check README and docs files that reference action tags
  const checkFiles = [
    'README.md',
    'README.en.md',
    'docs/use-cases/github-actions.md',
  ];
  for (const readmePath of checkFiles) {
    const text = await readText(readmePath);

    // Check action tags
    const tags = extractActionTags(text);
    for (const tag of tags) {
      if (tag !== `v${expectedVersion}`) {
        errors.push(
          `${readmePath}: action tag ${tag} does not match package.json version v${expectedVersion}`,
        );
      }
    }

    // Check latest release line
    const releaseVersion = extractLatestRelease(text);
    if (releaseVersion && releaseVersion !== expectedVersion) {
      errors.push(
        `${readmePath}: "Latest release" says v${releaseVersion}, expected v${expectedVersion}`,
      );
    }
  }

  // Check homepage URL
  const homepage = pkg.homepage || '';
  if (!homepage.startsWith('https://river-reviewer.vercel.app')) {
    errors.push(
      `package.json: homepage "${homepage}" should point to https://river-reviewer.vercel.app`,
    );
  }

  return errors;
}

// CLI entry point
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('validate-meta-consistency.mjs') ||
    process.argv[1].endsWith('validate-meta-consistency'));

if (isDirectRun) {
  validateMeta()
    .then((errors) => {
      if (errors.length === 0) {
        console.log('Meta consistency: OK');
        return 0;
      }
      console.error(`Meta consistency: ${errors.length} error(s) found`);
      for (const err of errors) {
        console.error(`  - ${err}`);
      }
      return 1;
    })
    .then((code) => {
      if (code !== 0) process.exitCode = code;
    })
    .catch((err) => {
      console.error(`Meta consistency check failed: ${err.message}`);
      process.exitCode = 1;
    });
}
