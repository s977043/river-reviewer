#!/usr/bin/env node
/**
 * Skill YAML Validation Tool
 *
 * Validates all skill.yaml files in the skills directory
 * against the SkillYamlSchema.
 */

import { readFileSync } from 'node:fs';
import { glob } from 'glob';
import { load as parseYaml } from 'js-yaml';
import { SkillYamlSchema } from '../src/lib/skillYamlSchema.mjs';

async function validateSkills() {
  console.log('🔍 Validating skill.yaml files...\n');

  // Find all skill.yaml files
  const skillFiles = await glob('skills/**/skill.yaml', {
    ignore: ['node_modules/**', '**/node_modules/**'],
  });

  if (skillFiles.length === 0) {
    console.log('ℹ️  No skill.yaml files found.');
    return;
  }

  console.log(`Found ${skillFiles.length} skill.yaml file(s)\n`);

  const results = [];

  for (const file of skillFiles) {
    try {
      // Read and parse YAML
      const content = readFileSync(file, 'utf-8');
      const data = parseYaml(content);

      // Validate with Zod
      const result = SkillYamlSchema.safeParse(data);

      if (result.success) {
        results.push({ file, valid: true });
        console.log(`✅ ${file}`);
      } else {
        results.push({ file, valid: false, errors: result.error });
        console.error(`❌ ${file}`);
        console.error(`   Errors:`);
        result.error.errors.forEach((err) => {
          const path = err.path.join('.');
          console.error(`   - ${path || '(root)'}: ${err.message}`);
        });
        console.error('');
      }
    } catch (error) {
      results.push({
        file,
        valid: false,
        error,
      });
      console.error(`❌ ${file}`);
      console.error(
        `   Parse error: ${error instanceof Error ? error.message : String(error)}`
      );
      console.error('');
    }
  }

  // Summary
  const validCount = results.filter((r) => r.valid).length;
  const invalidCount = results.length - validCount;

  console.log('\n📊 Validation Summary:');
  console.log(`   Total: ${results.length}`);
  console.log(`   Valid: ${validCount}`);
  console.log(`   Invalid: ${invalidCount}`);

  if (invalidCount > 0) {
    console.log('\n❌ Validation failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All skill.yaml files are valid!');
    process.exit(0);
  }
}

validateSkills().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
