import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { loadSkills, loadSkillFile } from '../../../core/skill-loader.mjs';
import { Logger } from '../utils/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function evalCommand(skillPath, options) {
  const logger = new Logger({ silent: options.quiet });

  try {
    if (options.all) {
      logger.startSpinner('Loading all skills...');
      const skills = await loadSkills();
      logger.succeedSpinner(`Loaded ${skills.length} skills`);

      logger.info('\nSkill Evaluation Summary:\n');
      for (const skill of skills) {
        const meta = skill.metadata;
        logger.info(`✓ ${meta.id}`);
        logger.info(`  Name: ${meta.name}`);
        logger.info(`  Phase: ${meta.phase}`);
        logger.info(`  Apply to: ${meta.applyTo?.join(', ') || 'N/A'}`);
        if (options.verbose) {
          logger.info(`  Description: ${meta.description}`);
          logger.info(`  Model hint: ${meta.modelHint || 'N/A'}`);
          logger.info(`  Severity: ${meta.severity || 'N/A'}`);
        }
        logger.info('');
      }

      logger.success(`Successfully evaluated ${skills.length} skills`);
      return;
    }

    if (!skillPath) {
      logger.error('Error: Skill path is required when --all is not specified');
      logger.info('Usage: river eval <skill-path> or river eval --all');
      process.exit(1);
    }

    const resolvedPath = resolve(skillPath);
    logger.startSpinner(`Loading skill from ${resolvedPath}...`);

    const skill = await loadSkillFile(resolvedPath);
    logger.succeedSpinner('Skill loaded successfully');

    const meta = skill.metadata;
    logger.info('\nSkill Details:\n');
    logger.info(`ID: ${meta.id}`);
    logger.info(`Name: ${meta.name}`);
    logger.info(`Description: ${meta.description}`);
    logger.info(`Phase: ${meta.phase}`);
    logger.info(`Apply to: ${meta.applyTo?.join(', ') || 'N/A'}`);
    logger.info(`Input context: ${meta.inputContext?.join(', ') || 'N/A'}`);
    logger.info(`Output kind: ${meta.outputKind?.join(', ') || 'N/A'}`);
    logger.info(`Model hint: ${meta.modelHint || 'N/A'}`);
    logger.info(`Severity: ${meta.severity || 'N/A'}`);
    logger.info(`Dependencies: ${meta.dependencies?.join(', ') || 'none'}`);
    logger.info(`Tags: ${meta.tags?.join(', ') || 'none'}`);

    if (options.verbose && skill.body) {
      logger.info('\nSkill Body:');
      logger.info('---');
      logger.info(skill.body.slice(0, 500) + (skill.body.length > 500 ? '...' : ''));
      logger.info('---');
    }

    logger.success('\nSkill validation passed');

  } catch (error) {
    logger.failSpinner('Evaluation failed');
    logger.error(`Error: ${error.message}`);
    if (options.debug) {
      logger.error(error.stack);
    }
    process.exit(1);
  }
}
