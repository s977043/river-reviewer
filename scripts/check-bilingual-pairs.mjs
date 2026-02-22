#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const pagesDir = path.join(repoRoot, 'pages');

const strict = process.argv.includes('--strict');

async function collectMdFiles(dir) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectMdFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

async function checkBilingualPairs() {
  let allFiles;
  try {
    allFiles = await collectMdFiles(pagesDir);
  } catch (err) {
    console.error(`❌ Failed to read pages/ directory: ${err.message}`);
    return false;
  }

  const jaFiles = new Set();
  const enFiles = new Set();

  for (const f of allFiles) {
    const rel = path.relative(repoRoot, f);
    if (rel.endsWith('.en.md')) {
      enFiles.add(rel);
    } else {
      jaFiles.add(rel);
    }
  }

  let missingEn = 0;
  let orphanedEn = 0;
  let paired = 0;

  // Check Japanese files for English pairs
  for (const ja of [...jaFiles].sort()) {
    const expectedEn = ja.replace(/\.md$/, '.en.md');
    if (enFiles.has(expectedEn)) {
      const enBasename = path.basename(expectedEn);
      console.log(`✅ ${ja} ↔ ${enBasename}`);
      paired++;
    } else {
      console.warn(`⚠️  ${ja}: missing .en.md pair`);
      missingEn++;
    }
  }

  // Check for orphaned English files
  for (const en of [...enFiles].sort()) {
    const expectedJa = en.replace(/\.en\.md$/, '.md');
    if (!jaFiles.has(expectedJa)) {
      console.warn(`⚠️  ${en}: orphaned (no Japanese source)`);
      orphanedEn++;
    }
  }

  console.log('');
  console.log(`📊 Summary: ${paired} paired, ${missingEn} missing .en.md, ${orphanedEn} orphaned .en.md`);

  const hasIssues = missingEn > 0 || orphanedEn > 0;
  if (hasIssues && strict) {
    console.error('❌ Strict mode: bilingual pair issues found');
    return false;
  }
  if (hasIssues) {
    console.log('ℹ️  Run with --strict to fail on pair issues');
  }
  return true;
}

const ok = await checkBilingualPairs();
if (!ok) {
  process.exitCode = 1;
}
