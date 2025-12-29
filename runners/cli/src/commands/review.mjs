import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { minimatch } from 'minimatch';
import { buildExecutionPlan } from '../../../core/review-runner.mjs';
import { loadSkills } from '../../../core/skill-loader.mjs';
import { Logger } from '../utils/logger.mjs';
import { formatPlan, formatComments, formatSkillList, formatSkipped } from '../utils/format.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function reviewCommand(files, options) {
  const logger = new Logger({ silent: options.quiet });

  try {
    logger.startSpinner('Loading skills...');
    const skills = await loadSkills();
    logger.succeedSpinner(`Loaded ${skills.length} skills`);

    const phase = options.phase || 'midstream';
    const changedFiles = files.length > 0 ? files : await getChangedFiles();

    if (changedFiles.length === 0) {
      logger.warn('No files to review');
      return;
    }

    logger.info(`\nReviewing ${changedFiles.length} file(s) in ${phase} phase\n`);

    logger.startSpinner('Building execution plan...');
    const plan = await buildExecutionPlan({
      phase,
      changedFiles,
      availableContexts: options.context ? options.context.split(',') : ['diff', 'fullFile'],
      availableDependencies: options.dependency ? options.dependency.split(',') : null,
      preferredModelHint: options.modelHint || 'balanced',
    });
    logger.succeedSpinner('Execution plan ready');

    const { selected, skipped } = formatPlan(plan);

    logger.info(`\nSelected skills (${selected.length}):`);
    logger.info(`  ${formatSkillList(selected)}`);

    if (skipped.length > 0 && options.verbose) {
      logger.info(`\nSkipped skills (${skipped.length}):`);
      logger.info(formatSkipped(skipped));
    }

    if (plan.impactTags && plan.impactTags.length > 0) {
      logger.info(`\nImpact tags: ${plan.impactTags.join(', ')}`);
    }

    if (options.dryRun) {
      logger.info('\nDry run mode - no review executed');
      return;
    }

    logger.info('\n✓ Review plan ready. Use --dry-run to see the plan without executing.');
    logger.info('Note: Actual review execution requires integration with review engine.');

  } catch (error) {
    logger.failSpinner('Review failed');
    logger.error(`Error: ${error.message}`);
    if (options.debug) {
      logger.error(error.stack);
    }
    process.exit(1);
  }
}

async function getChangedFiles() {
  // This is a placeholder - in practice, this would use git to detect changed files
  // For now, return an empty array to indicate no files
  return [];
}
