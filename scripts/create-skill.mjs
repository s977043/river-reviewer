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
<<<<<<< Updated upstream
 * Prompt user for input
 */
async function prompt(rl, question, defaultValue) {
  const answer = await rl.question(
    defaultValue ? `${question} (${defaultValue}): ` : `${question}: `
  );
  return answer.trim() || defaultValue || '';
=======
 * Prompt user for input with retry on validation failure
 */
async function prompt(rl, question, defaultValue, validator = null) {
  while (true) {
    const answer = await rl.question(
      defaultValue ? `${question} (${defaultValue}): ` : `${question}: `
    );
    const value = answer.trim() || defaultValue || '';

    if (validator) {
      const validation = validator(value);
      if (validation !== true) {
        console.error(`❌ ${validation}`);
        continue; // Retry on validation failure
      }
    }

    return value;
  }
>>>>>>> Stashed changes
}

/**
 * Validate skill ID format
 */
function validateSkillId(id) {
<<<<<<< Updated upstream
  if (!id) return 'Skill ID is required';
  if (!/^[a-z0-9-]+$/.test(id)) {
    return 'Skill ID must contain only lowercase letters, numbers, and hyphens';
=======
  if (!id) return 'スキルIDは必須です';
  if (!/^[a-z0-9-]+$/.test(id)) {
    return 'スキルIDは小文字、数字、ハイフンのみ使用できます';
>>>>>>> Stashed changes
  }
  return true;
}

/**
 * Validate version format
 */
function validateVersion(version) {
<<<<<<< Updated upstream
  if (!version) return 'Version is required';
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    return 'Version must be in semver format (x.y.z)';
=======
  if (!version) return 'バージョンは必須です';
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    return 'バージョンはsemver形式（x.y.z）である必要があります';
>>>>>>> Stashed changes
  }
  return true;
}

/**
<<<<<<< Updated upstream
 * Replace placeholders in file content
 */
function replacePlaceholders(content, replacements) {
  let result = content;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key, 'g');
    result = result.replace(regex, value);
  }
=======
 * Validate required field
 */
function validateRequired(fieldName) {
  return (value) => {
    if (!value) return `${fieldName}は必須です`;
    return true;
  };
}

/**
 * Validate phase
 */
function validatePhase(phase) {
  if (!['upstream', 'midstream', 'downstream'].includes(phase)) {
    return 'フェーズは upstream、midstream、または downstream である必要があります';
  }
  return true;
}

/**
 * Validate severity
 */
function validateSeverity(severity) {
  if (!['info', 'minor', 'major', 'critical'].includes(severity)) {
    return '重要度は info、minor、major、または critical である必要があります';
  }
  return true;
}

/**
 * Replace placeholders in file content with safer strategy
 */
function replacePlaceholders(content, replacements) {
  let result = content;

  // Sort replacements by length (descending) to replace more specific patterns first
  const sortedReplacements = Object.entries(replacements).sort((a, b) => b[0].length - a[0].length);

  for (const [key, value] of sortedReplacements) {
    // Escape special regex characters in the key
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKey, 'g');
    result = result.replace(regex, value);
  }

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  console.log('🚀 Create New Skill\n');
=======
  console.log('🚀 新しいスキルを作成\n');

  // Check template directory existence
  if (!existsSync(templateDir)) {
    console.error(`❌ テンプレートディレクトリが見つかりません: ${templateDir}`);
    process.exit(1);
  }
>>>>>>> Stashed changes

  const rl = readline.createInterface({ input, output });

  try {
<<<<<<< Updated upstream
    // Collect user input
    const id = await prompt(rl, 'Skill ID (e.g., rr-midstream-code-quality-001)');
    const validation = validateSkillId(id);
    if (validation !== true) {
      console.error(`❌ ${validation}`);
      process.exit(1);
    }
=======
    // Collect user input with validation and retry
    const id = await prompt(
      rl,
      'スキルID（例: rr-midstream-code-quality-001）',
      null,
      validateSkillId
    );
>>>>>>> Stashed changes

    // Check if skill already exists
    const skillPath = join(skillsDir, id);
    if (existsSync(skillPath)) {
<<<<<<< Updated upstream
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
=======
      console.error(`❌ スキルは既に存在します: ${skillPath}`);
      rl.close();
      process.exit(1);
    }

    const version = await prompt(
      rl,
      'バージョン',
      '0.1.0',
      validateVersion
    );

    const name = await prompt(
      rl,
      'スキル名（例: コード品質レビュー）',
      null,
      validateRequired('スキル名')
    );

    const description = await prompt(
      rl,
      '説明（このスキルが何をチェックするか）',
      null,
      validateRequired('説明')
    );

    const phase = await prompt(
      rl,
      'フェーズ (upstream/midstream/downstream)',
      'midstream',
      validatePhase
    );

    const applyTo = await prompt(
      rl,
      'ファイルパターン（glob、カンマ区切り）',
      'src/**/*.ts'
    );
>>>>>>> Stashed changes
    const applyToArray = applyTo
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

<<<<<<< Updated upstream
    const tags = await prompt(rl, 'Tags (comma-separated)', '');
=======
    const tags = await prompt(rl, 'タグ（カンマ区切り）', '');
>>>>>>> Stashed changes
    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

<<<<<<< Updated upstream
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
=======
    const severity = await prompt(
      rl,
      '重要度 (info/minor/major/critical)',
      'minor',
      validateSeverity
    );

    rl.close();

    // Prepare replacements with more specific patterns first
    const replacements = {
      // Most specific patterns first to avoid unintended replacements
      'rr-<phase>-<category>-<number>': id,
      '<Skill Name>': name,
      '<What this skill does>': description,
      '"0.1.0"': `"${version}"`,
      // Multi-line patterns
      "  - 'src/**/*.ts'\n  - 'tests/**/*.test.ts'": applyToArray
        .map((p) => `  - '${p}'`)
        .join('\n'),
      // Tag patterns
      '  - example\n  - category': tagsArray.length > 0
        ? tagsArray.map((t) => `  - ${t}`).join('\n')
        : '  - example',
      // YAML value patterns (more specific)
      'phase: midstream': `phase: ${phase}`,
      'severity: minor': `severity: ${severity}`,
    };

    console.log('\n📝 スキルファイルを作成中...\n');
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
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
=======
    console.log(`\n✅ スキルを作成しました: ${skillPath}\n`);
    console.log('次のステップ:');
    console.log(`  1. cd ${skillPath}`);
    console.log('  2. prompt/system.md と prompt/user.md を編集');
    console.log('  3. fixtures/ にテストフィクスチャを追加');
    console.log('  4. golden/ に期待される出力を追加');
    console.log('  5. バリデーション実行: npm run validate:skill-yaml');
    console.log('  6. テスト実行: npx promptfoo eval（設定済みの場合）\n');
  } catch (error) {
    rl.close();
    console.error('❌ エラー:', error.message);
>>>>>>> Stashed changes
    process.exit(1);
  }
}

main();
