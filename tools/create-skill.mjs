#!/usr/bin/env node
/**
 * Create Skill Scaffolding Tool
 *
 * Generates a new skill from template with interactive prompts.
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const templateDir = join(repoRoot, 'specs/templates/skill');
const skillsDir = join(repoRoot, 'skills');

/**
 * Prompt user for input
 */
async function prompt(rl, question, defaultValue) {
  const answer = await rl.question(
    defaultValue ? `${question} (${defaultValue}): ` : `${question}: `
  );
  return answer.trim() || defaultValue || '';
}

/**
 * Validate skill ID format
 */
function validateSkillId(id) {
  if (!id) return 'Skill ID is required';
  if (!/^[a-z0-9-]+$/.test(id)) {
    return 'Skill ID must contain only lowercase letters, numbers, and hyphens';
  }
  return true;
}

/**
 * Validate version format
 */
function validateVersion(version) {
  if (!version) return 'Version is required';
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    return 'Version must be in semver format (x.y.z)';
  }
  return true;
}

/**
 * Replace placeholders in file content
 */
function replacePlaceholders(content, replacements) {
  let result = content;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * Process template file
 */
function processTemplateFile(sourcePath, targetPath, replacements) {
  const content = readFileSync(sourcePath, 'utf-8');
  const processed = replacePlaceholders(content, replacements);
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, processed, 'utf-8');
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Create New Skill\n');

  const rl = readline.createInterface({ input, output });

  try {
    // Collect user input
    const id = await prompt(rl, 'Skill ID (e.g., rr-midstream-code-quality-001)');
    const validation = validateSkillId(id);
    if (validation !== true) {
      console.error(`❌ ${validation}`);
      process.exit(1);
    }

    // Check if skill already exists
    const skillPath = join(skillsDir, id);
    if (existsSync(skillPath)) {
      console.error(`❌ Skill already exists at ${skillPath}`);
      process.exit(1);
    }

    const version = await prompt(rl, 'Version', '0.1.0');
    const versionValidation = validateVersion(version);
    if (versionValidation !== true) {
      console.error(`❌ ${versionValidation}`);
      process.exit(1);
    }

    const name = await prompt(rl, 'Skill Name (e.g., Code Quality Review)');
    if (!name) {
      console.error('❌ Skill name is required');
      process.exit(1);
    }

    const description = await prompt(rl, 'Description');
    if (!description) {
      console.error('❌ Description is required');
      process.exit(1);
    }

    const phase = await prompt(
      rl,
      'Phase (upstream/midstream/downstream)',
      'midstream'
    );
    if (!['upstream', 'midstream', 'downstream'].includes(phase)) {
      console.error('❌ Phase must be upstream, midstream, or downstream');
      process.exit(1);
    }

    const applyTo = await prompt(rl, 'File patterns (glob, comma-separated)', 'src/**/*.ts');
    const applyToArray = applyTo
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const tags = await prompt(rl, 'Tags (comma-separated)', '');
    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const severity = await prompt(rl, 'Severity (info/minor/major/critical)', 'minor');
    if (!['info', 'minor', 'major', 'critical'].includes(severity)) {
      console.error('❌ Severity must be info, minor, major, or critical');
      process.exit(1);
    }

    rl.close();

    // Prepare replacements
    const replacements = {
      '<phase>': phase,
      '<name>': id,
      '<number>': '001',
      '<Skill Name>': name,
      '<What this skill does>': description,
      'rr-<phase>-<name>-<number>': id,
      '"0.1.0"': `"${version}"`,
      'midstream': phase,
      "- 'src/\\*\\*/\\*.ts'": applyToArray
        .map((p) => `  - '${p}'`)
        .join('\n')
        .trim(),
      '- example': tagsArray.map((t) => `  - ${t}`).join('\n') || '  - example',
      'severity: minor': `severity: ${severity}`,
    };

    console.log('\n📝 Creating skill files...\n');

    // Copy template structure
    cpSync(templateDir, skillPath, { recursive: true });

    // Process template files
    const filesToProcess = [
      'skill.yaml',
      'README.md',
      'prompt/system.md',
      'prompt/user.md',
      'eval/promptfoo.yaml',
    ];

    for (const file of filesToProcess) {
      const sourcePath = join(skillPath, file);
      if (existsSync(sourcePath)) {
        processTemplateFile(sourcePath, sourcePath, replacements);
        console.log(`  ✅ ${file}`);
      }
    }

    console.log(`\n✅ Created skill at ${skillPath}\n`);
    console.log('Next steps:');
    console.log(`  1. cd ${skillPath}`);
    console.log('  2. Edit prompt/system.md and prompt/user.md');
    console.log('  3. Add test fixtures in fixtures/');
    console.log('  4. Add expected outputs in golden/');
    console.log('  5. Run validation: npm run validate:skill-yaml');
    console.log('  6. Run tests: npx promptfoo eval (if configured)\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
