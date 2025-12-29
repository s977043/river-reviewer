#!/usr/bin/env node
/**
 * Run promptfoo evaluations for all skills
 *
 * This script discovers all skills with eval/promptfoo.yaml and runs
 * promptfoo evaluation for each one.
 */

import { readdir, access } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const skillsDir = join(repoRoot, 'skills');

/**
 * Find all skills with promptfoo.yaml config
 */
async function findSkillsWithEval() {
  const skillDirs = [];
  const entries = await readdir(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('_') || entry.name === 'community') continue;

    const skillPath = join(skillsDir, entry.name);
    const evalConfigPath = join(skillPath, 'eval', 'promptfoo.yaml');

    try {
      await access(evalConfigPath);
      skillDirs.push({
        name: entry.name,
        path: skillPath,
        evalConfig: evalConfigPath,
      });
    } catch {
      // No eval config, skip
    }
  }

  return skillDirs;
}

/**
 * Run promptfoo eval for a single skill
 */
function runEval(skill) {
  const relativePath = relative(repoRoot, skill.path);
  console.log(`\n📊 Evaluating: ${skill.name}`);
  console.log(`   Path: ${relativePath}`);

  try {
    const result = execSync(
      `npx promptfoo eval -c eval/promptfoo.yaml --output eval/results.json`,
      {
        cwd: skill.path,
        stdio: 'inherit',
        env: {
          ...process.env,
          PROMPTFOO_DISABLE_TELEMETRY: '1',
        },
      }
    );
    console.log(`✅ ${skill.name}: Evaluation complete`);
    return { skill: skill.name, success: true };
  } catch (err) {
    console.error(`❌ ${skill.name}: Evaluation failed`);
    console.error(`   Error: ${err.message}`);
    return { skill: skill.name, success: false, error: err.message };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Running promptfoo evaluations for all skills\n');

  const skills = await findSkillsWithEval();

  if (skills.length === 0) {
    console.log('⚠️  No skills found with eval/promptfoo.yaml configuration');
    return;
  }

  console.log(`Found ${skills.length} skill(s) with eval configuration:\n`);
  skills.forEach((skill) => {
    console.log(`  - ${skill.name}`);
  });

  const results = [];
  for (const skill of skills) {
    const result = runEval(skill);
    results.push(result);
  }

  // Summary
  console.log('\n📊 Evaluation Summary\n');
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`   Total: ${results.length}`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed skills:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.skill}: ${r.error}`);
      });
    process.exit(1);
  }

  console.log('\n✅ All evaluations completed successfully!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
