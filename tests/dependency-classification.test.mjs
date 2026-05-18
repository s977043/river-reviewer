// Guards the #801 dependency split: the review engine runtime must not
// pull docs-site dependencies, and engine runtime deps must stay in
// `dependencies` (so `npm install --omit=dev` yields a working engine).

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test, { describe } from 'node:test';

const pkg = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8')
);
const deps = pkg.dependencies ?? {};
const devDeps = pkg.devDependencies ?? {};

// Docs-site only: used by Docusaurus build / src/components/Dashboard
// (.jsx), never by the engine runtime (src/cli.mjs, src/lib/*.mjs,
// runners/*). Must be devDependencies so engine consumers can install
// with --omit=dev.
const DOCS_ONLY = [
  '@docusaurus/core',
  '@docusaurus/preset-classic',
  '@docusaurus/theme-mermaid',
  '@mermaid-js/layout-elk',
  'react',
  'react-dom',
  'recharts',
];

// Imported by the engine runtime (skill-loader / agent-skill-bridge);
// must be runtime dependencies.
const ENGINE_RUNTIME = ['ajv', 'ajv-formats'];

describe('#801 dependency classification', () => {
  test('docs-only packages are devDependencies, not dependencies', () => {
    for (const d of DOCS_ONLY) {
      assert.equal(d in deps, false, `${d} must not be in dependencies`);
      assert.equal(d in devDeps, true, `${d} must be in devDependencies`);
    }
  });

  test('engine runtime packages are dependencies', () => {
    for (const d of ENGINE_RUNTIME) {
      assert.equal(d in deps, true, `${d} must be in dependencies (engine runtime)`);
      assert.equal(d in devDeps, false, `${d} must not be duplicated in devDependencies`);
    }
  });
});
