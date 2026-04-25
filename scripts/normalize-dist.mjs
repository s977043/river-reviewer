#!/usr/bin/env node
// Normalize line endings in the GitHub Action dist to LF.
// ncc bundles tslib and other deps with CRLF on some platforms;
// this ensures cross-platform deterministic output.
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const distDir = new URL('../runners/github-action/dist', import.meta.url).pathname;
let normalized = 0;
for (const file of readdirSync(distDir)) {
  if (file.endsWith('.mjs') || file.endsWith('.map') || file.endsWith('.cjs')) {
    const path = join(distDir, file);
    const content = readFileSync(path, 'utf8');
    const fixed = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (fixed !== content) {
      writeFileSync(path, fixed, 'utf8');
      normalized++;
    }
  }
}
if (normalized > 0) console.log(`Normalized ${normalized} file(s) in dist/`);
