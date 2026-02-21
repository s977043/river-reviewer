import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {
  parseFrontMatter,
  loadSchema,
  createSkillValidator,
  loadSkills,
  defaultPaths,
} from '../../runners/core/skill-loader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const AGENT_SKILL_FILENAME = 'SKILL.md';
const DEFAULT_SEARCH_DIRS = ['.agents/skills', '.github/skills', '.claude/skills'];
const ASSET_DIRS = ['references', 'scripts', 'prompt'];
const KNOWN_RR_FIELDS = new Set([
  'id',
  'name',
  'description',
  'category',
  'phase',
  'applyTo',
  'files',
  'path_patterns',
  'trigger',
  'tags',
  'severity',
  'inputContext',
  'outputKind',
  'modelHint',
  'dependencies',
  'priority',
  'version',
  'prompt',
  'eval',
  'fixturesDir',
  'goldenDir',
  'instruction',
  'metadata',
]);

export class AgentSkillBridgeError extends Error {
  constructor(message, details = undefined) {
    super(message);
    this.name = 'AgentSkillBridgeError';
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// Description quality validation
// ---------------------------------------------------------------------------

const VAGUE_PATTERNS = [/^(this skill |a skill |skill that )/i];
const GENERIC_PHRASES = [
  'support the project',
  'help with development',
  'assist with tasks',
  'improve code quality',
  'general purpose',
  'various tasks',
];
const TRIGGER_KEYWORDS = /\b(when|if|during|after|before|on|for|upon)\b/i;

export function validateDescriptionQuality(description) {
  const issues = [];
  if (!description || typeof description !== 'string') {
    return {
      ok: false,
      issues: [{ type: 'too_short', message: 'description is missing or empty' }],
    };
  }
  const trimmed = description.trim();
  if (trimmed.length < 16) {
    issues.push({
      type: 'too_short',
      message: `description is only ${trimmed.length} chars (min recommended: 16)`,
    });
  }
  for (const p of VAGUE_PATTERNS) {
    if (p.test(trimmed)) {
      issues.push({ type: 'too_vague', message: `description matches vague pattern: ${p}` });
      break;
    }
  }
  const lower = trimmed.toLowerCase();
  for (const phrase of GENERIC_PHRASES) {
    if (lower.includes(phrase)) {
      issues.push({
        type: 'too_generic',
        message: `description contains generic phrase: "${phrase}"`,
      });
      break;
    }
  }
  if (!TRIGGER_KEYWORDS.test(trimmed)) {
    issues.push({
      type: 'no_trigger_context',
      message: 'description lacks trigger context (when/if/during/for)',
    });
  }
  return { ok: issues.length === 0, issues };
}

// ---------------------------------------------------------------------------
// Progressive disclosure – meta-only parse (no body / assets)
// ---------------------------------------------------------------------------

export async function parseAgentSkillMeta(skillMdPath) {
  const raw = await fs.readFile(skillMdPath, 'utf8');
  const fmEnd = raw.indexOf('---', raw.indexOf('---') + 3);
  const fmBlock = fmEnd > 0 ? raw.slice(0, fmEnd + 3) + '\n' : raw;
  const { metadata } = parseFrontMatter(fmBlock, { filePath: skillMdPath });
  const dirName = path.basename(path.dirname(skillMdPath));
  return {
    id: metadata.id || `as-${dirName}`,
    name: metadata.name || dirName,
    description: metadata.description || '',
    source: 'agent',
    originPath: path.dirname(skillMdPath),
    category: metadata.category,
    tags: metadata.tags,
    version: metadata.version,
  };
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

async function dirExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function listSkillPackages(dirPath) {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
  const groups = await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory()) return [];
      const entryPath = path.join(dirPath, entry.name);
      const skillPath = path.join(entryPath, AGENT_SKILL_FILENAME);
      try {
        const stat = await fs.stat(skillPath);
        if (stat.isFile()) return [skillPath];
      } catch {
        /* not a skill package – check nested */
      }
      return listSkillPackages(entryPath);
    })
  );
  return groups.flat().sort();
}

export async function discoverAgentSkillPaths(projectRoot, fromPath) {
  if (fromPath) {
    const resolved = path.resolve(fromPath);
    if (!(await dirExists(resolved))) return [];
    // fromPath might itself contain SKILL.md packages
    return listSkillPackages(resolved);
  }

  const paths = [];
  for (const rel of DEFAULT_SEARCH_DIRS) {
    const dir = path.join(projectRoot, rel);
    if (await dirExists(dir)) {
      const found = await listSkillPackages(dir);
      paths.push(...found);
    }
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Import – parse & convert
// ---------------------------------------------------------------------------

async function listAssets(dirPath) {
  const assets = {};
  for (const name of ASSET_DIRS) {
    const assetPath = path.join(dirPath, name);
    if (await dirExists(assetPath)) {
      assets[name] = assetPath;
    }
  }
  return assets;
}

export async function parseAgentSkill(skillMdPath) {
  const raw = await fs.readFile(skillMdPath, 'utf8');
  const { metadata, body } = parseFrontMatter(raw, { filePath: skillMdPath });
  const dirPath = path.dirname(skillMdPath);
  const assets = await listAssets(dirPath);
  return { metadata, body, dirPath, assets };
}

export function generateAgentSkillId(dirName, existingIds) {
  const base = `as-${dirName}`;
  if (!existingIds.has(base)) return base;
  let n = 2;
  while (existingIds.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

function extractExtraMetadata(metadata) {
  const extra = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!KNOWN_RR_FIELDS.has(key)) {
      extra[key] = value;
    }
  }
  return Object.keys(extra).length ? extra : undefined;
}

export function convertAgentSkillToRR(parsed, existingIds = new Set()) {
  const { metadata: rawMeta, body, dirPath } = parsed;
  const dirName = path.basename(dirPath);

  const meta = { ...rawMeta };

  // ID generation
  if (!meta.id) {
    meta.id = generateAgentSkillId(dirName, existingIds);
  }

  // Category default
  if (!meta.category) {
    meta.category = 'core';
  }

  // Phase default (derived from category)
  if (!meta.phase) {
    if (meta.category === 'core') {
      meta.phase = ['upstream', 'midstream', 'downstream'];
    } else {
      meta.phase = meta.category;
    }
  }

  // applyTo default
  if (!meta.applyTo && !meta.files && !meta.path_patterns && !meta.trigger) {
    meta.applyTo = ['**/*'];
  }

  // Collect extra metadata (non-RR fields) and inject source/originPath
  const extra = extractExtraMetadata(meta);
  meta.metadata = {
    ...(meta.metadata ?? {}),
    ...(extra ?? {}),
    source: 'agent',
    originPath: dirPath,
  };

  // Remove extra fields from top level (they're now in metadata)
  if (extra) {
    for (const key of Object.keys(extra)) {
      delete meta[key];
    }
  }

  return {
    metadata: meta,
    body,
    path: path.join(dirPath, AGENT_SKILL_FILENAME),
  };
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

async function loadLooseSchema() {
  const schemaPath = path.join(repoRoot, 'schemas', 'agent-skill-loose.schema.json');
  return loadSchema(schemaPath);
}

function createLooseValidator(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

function validateMeta(metadata, validate) {
  const copy = JSON.parse(JSON.stringify(metadata));
  const ok = validate(copy);
  if (!ok) {
    const details = (validate.errors ?? [])
      .map((e) => `${e.instancePath || '/'} ${e.message}`)
      .join('; ');
    return { ok: false, error: details, ajvErrors: validate.errors };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Import (batch)
// ---------------------------------------------------------------------------

export async function importAgentSkills(projectRoot, options = {}) {
  const { fromPath, strict = true, dryRun = false, outputDir } = options;
  const skillPaths = await discoverAgentSkillPaths(projectRoot, fromPath);

  const imported = [];
  const errors = [];
  const warnings = [];

  if (!skillPaths.length) {
    warnings.push('No Agent Skills (SKILL.md) found.');
    return { imported, errors, warnings };
  }

  // Load validators
  const strictSchema = await loadSchema(defaultPaths.schemaPath);
  const strictValidator = createSkillValidator(strictSchema);
  const looseSchema = await loadLooseSchema();
  const looseValidator = createLooseValidator(looseSchema);

  const existingIds = new Set();

  for (const skillPath of skillPaths) {
    try {
      const parsed = await parseAgentSkill(skillPath);

      // Pre-validation (loose): check minimal fields before conversion
      const preCheck = validateMeta(parsed.metadata, looseValidator);
      if (!preCheck.ok) {
        errors.push({ path: skillPath, message: `Loose validation failed: ${preCheck.error}` });
        continue;
      }

      // Description quality gate
      const descQuality = validateDescriptionQuality(parsed.metadata.description);
      if (!descQuality.ok) {
        const msgs = descQuality.issues.map((i) => i.message).join('; ');
        warnings.push(`${path.relative(projectRoot, skillPath)}: description quality: ${msgs}`);
      }

      const converted = convertAgentSkillToRR(parsed, existingIds);
      existingIds.add(converted.metadata.id);

      if (strict) {
        // Strict: validate the fully converted metadata against RR schema
        const result = validateMeta(converted.metadata, strictValidator);
        if (!result.ok) {
          errors.push({ path: skillPath, message: `Strict validation failed: ${result.error}` });
          continue;
        }
      } else {
        // Loose: warn about fields that were auto-filled
        const autoFilled = [];
        if (!parsed.metadata.id) autoFilled.push('id');
        if (!parsed.metadata.category) autoFilled.push('category');
        if (!parsed.metadata.phase) autoFilled.push('phase');
        if (!parsed.metadata.applyTo && !parsed.metadata.files && !parsed.metadata.path_patterns) {
          autoFilled.push('applyTo');
        }
        if (autoFilled.length) {
          warnings.push(
            `${path.relative(projectRoot, skillPath)}: auto-filled [${autoFilled.join(', ')}]`
          );
        }
      }

      if (!dryRun) {
        const dest = outputDir ?? path.join(projectRoot, 'skills', 'agent-skills');
        await writeImportedSkill(converted, dest);
      }

      imported.push(converted);
    } catch (err) {
      errors.push({
        path: skillPath,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { imported, errors, warnings };
}

function assertSafePath(base, child, label) {
  const resolved = path.resolve(base, child);
  if (!resolved.startsWith(path.resolve(base) + path.sep) && resolved !== path.resolve(base)) {
    throw new AgentSkillBridgeError(`${label} "${child}" would escape output directory`);
  }
  return resolved;
}

async function writeImportedSkill(skill, destDir) {
  const dirName = skill.metadata.id;
  const skillDir = assertSafePath(destDir, dirName, 'Skill id');
  await fs.mkdir(skillDir, { recursive: true });

  // Write as RR-compatible SKILL.md (with full RR metadata in frontmatter)
  const frontmatter = { ...skill.metadata };
  const content = `---\n${yaml.dump(frontmatter, { lineWidth: 120, quotingType: "'", noCompatMode: true }).trimEnd()}\n---\n\n${skill.body}\n`;
  await fs.writeFile(path.join(skillDir, AGENT_SKILL_FILENAME), content, 'utf8');
}

// ---------------------------------------------------------------------------
// Export (RR → Agent Skills)
// ---------------------------------------------------------------------------

const RR_SPECIFIC_FIELDS = new Set([
  'id',
  'category',
  'phase',
  'applyTo',
  'files',
  'path_patterns',
  'severity',
  'inputContext',
  'outputKind',
  'modelHint',
  'dependencies',
  'priority',
  'trigger',
  'prompt',
  'eval',
  'fixturesDir',
  'goldenDir',
]);

export function serializeToSkillMd(skill) {
  const meta = skill.metadata;
  const fm = {};

  // Always include name and description
  fm.name = meta.name;
  fm.description = meta.description;

  // Preserve tags at top level if present
  if (meta.tags?.length) {
    fm.tags = meta.tags;
  }

  // Preserve version if present
  if (meta.version) {
    fm.version = meta.version;
  }

  // Nest RR-specific fields under metadata.rr
  const rrMeta = {};
  for (const field of RR_SPECIFIC_FIELDS) {
    if (meta[field] !== undefined) {
      rrMeta[field] = meta[field];
    }
  }
  if (Object.keys(rrMeta).length) {
    fm.metadata = { ...(fm.metadata ?? {}), rr: rrMeta };
  }

  const yamlStr = yaml.dump(fm, { lineWidth: 120, quotingType: "'", noCompatMode: true }).trimEnd();
  const body = skill.body || '';
  return `---\n${yamlStr}\n---\n\n${body}\n`;
}

function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function exportSkillToAgentFormat(skill, outputDir, options = {}) {
  const { includeAssets = false } = options;
  const rawName = skill.metadata.id || skill.metadata.name;
  if (!rawName) {
    throw new AgentSkillBridgeError('Skill has no id or name for directory creation');
  }
  // Critical rule: folder names must be kebab-case
  const dirName = toKebabCase(rawName);
  if (!dirName) {
    throw new AgentSkillBridgeError(
      `Skill id or name "${rawName}" is not valid for directory creation after kebab-case normalization`
    );
  }
  const skillDir = assertSafePath(outputDir, dirName, 'Skill id');
  await fs.mkdir(skillDir, { recursive: true });

  const content = serializeToSkillMd(skill);
  // Critical rule: file must be exactly SKILL.md
  const skillMdPath = path.join(skillDir, AGENT_SKILL_FILENAME);
  await fs.writeFile(skillMdPath, content, 'utf8');

  if (includeAssets && skill.path) {
    const sourceDir = path.dirname(skill.path);
    for (const assetDir of ASSET_DIRS) {
      const src = path.join(sourceDir, assetDir);
      if (await dirExists(src)) {
        const dest = path.join(skillDir, assetDir);
        await fs.cp(src, dest, { recursive: true });
      }
    }
  }

  // Critical rule: no README.md inside skill folder
  const readmePath = path.join(skillDir, 'README.md');
  try {
    await fs.unlink(readmePath);
  } catch {
    // No README to remove – expected
  }

  return { path: skillMdPath, dirName };
}

export async function exportAllSkills(projectRoot, options = {}) {
  const { outputDir, includeAssets = false } = options;
  const dest = outputDir ?? path.join(projectRoot, '.agents', 'skills');
  const skills = await loadSkills({
    skillsDir: path.join(projectRoot, 'skills'),
    excludedTags: [],
  });

  const exported = [];
  const errors = [];

  for (const skill of skills) {
    try {
      const result = await exportSkillToAgentFormat(skill, dest, { includeAssets });
      exported.push(result.path);
    } catch (err) {
      errors.push({
        id: skill.metadata?.id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { exported, errors };
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function listAllSkills(projectRoot, options = {}) {
  const { source = 'all' } = options;
  const skills = [];

  if (source === 'rr' || source === 'all') {
    const rrSkills = await loadSkills({
      skillsDir: path.join(projectRoot, 'skills'),
      excludedTags: [],
    });
    for (const s of rrSkills) {
      skills.push({
        id: s.metadata.id,
        name: s.metadata.name,
        description: s.metadata.description || '',
        source: 'rr',
        path: path.relative(projectRoot, s.path),
      });
    }
  }

  if (source === 'agent' || source === 'all') {
    const agentPaths = await discoverAgentSkillPaths(projectRoot);
    for (const skillPath of agentPaths) {
      try {
        // Progressive disclosure: meta-only parse for listing
        const summary = await parseAgentSkillMeta(skillPath);
        skills.push({
          id: summary.id,
          name: summary.name,
          description: summary.description,
          source: 'agent',
          path: path.relative(projectRoot, skillPath),
        });
      } catch {
        // Skip unparseable agent skills in listing
      }
    }
  }

  return { skills };
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

export async function runSkillsSubcommand(parsed) {
  const projectRoot = path.resolve(parsed.target || '.');
  const sub = parsed.skillsSubcommand;

  if (sub === 'import') {
    const result = await importAgentSkills(projectRoot, {
      fromPath: parsed.fromPath,
      strict: parsed.validationMode !== 'loose',
      dryRun: parsed.dryRun,
      outputDir: parsed.toPath,
    });

    if (result.warnings.length) {
      for (const w of result.warnings) console.warn(`⚠️  ${w}`);
    }
    if (result.errors.length) {
      for (const e of result.errors) console.error(`❌ ${e.path}: ${e.message}`);
    }
    console.log(
      `Import complete: ${result.imported.length} imported, ${result.errors.length} failed, ${result.warnings.length} warnings.`
    );
    return result.errors.length ? 1 : 0;
  }

  if (sub === 'export') {
    const result = await exportAllSkills(projectRoot, {
      outputDir: parsed.toPath,
      includeAssets: parsed.includeAssets,
    });

    if (result.errors.length) {
      for (const e of result.errors) console.error(`❌ ${e.id}: ${e.message}`);
    }
    console.log(
      `Export complete: ${result.exported.length} exported, ${result.errors.length} failed.`
    );
    return result.errors.length ? 1 : 0;
  }

  if (sub === 'list') {
    const result = await listAllSkills(projectRoot, { source: parsed.listSource || 'all' });

    if (!result.skills.length) {
      console.log('No skills found.');
      return 0;
    }

    // Table header with description quality indicator
    const idW = Math.max(4, ...result.skills.map((s) => s.id.length));
    const nameW = Math.max(4, ...result.skills.map((s) => s.name.length));
    const srcW = 6;
    const descW = 40;

    console.log(
      `${'ID'.padEnd(idW)}  ${'NAME'.padEnd(nameW)}  ${'SOURCE'.padEnd(srcW)}  ${'DESCRIPTION'.padEnd(descW)}  PATH`
    );
    console.log(
      `${'-'.repeat(idW)}  ${'-'.repeat(nameW)}  ${'-'.repeat(srcW)}  ${'-'.repeat(descW)}  ----`
    );
    let descWarnings = 0;
    for (const s of result.skills) {
      const desc = s.description || '';
      const quality = validateDescriptionQuality(desc);
      const flag = quality.ok ? '' : ' (!)';
      if (!quality.ok) descWarnings++;
      const maxTextLen = descW - flag.length;
      const descDisplay =
        (desc.length > maxTextLen ? desc.slice(0, maxTextLen - 3) + '...' : desc) + flag;
      console.log(
        `${s.id.padEnd(idW)}  ${s.name.padEnd(nameW)}  ${s.source.padEnd(srcW)}  ${descDisplay.padEnd(descW)}  ${s.path}`
      );
    }
    console.log(`\nTotal: ${result.skills.length} skills`);
    if (descWarnings > 0) {
      console.log(`Description quality warnings: ${descWarnings} skill(s) marked with (!)`);
    }
    return 0;
  }

  console.error(`Unknown skills subcommand: ${sub}`);
  return 1;
}
