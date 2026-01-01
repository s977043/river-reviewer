#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

/**
 * @typedef {'upstream' | 'midstream' | 'downstream'} PhaseEnum
 * @typedef {PhaseEnum | PhaseEnum[]} Phase
 * @typedef {'info' | 'minor' | 'major' | 'critical'} Severity
 * @typedef {'diff' | 'fullFile' | 'tests' | 'adr' | 'commitMessage' | 'repoConfig'} InputContext
 * @typedef {'findings' | 'summary' | 'actions' | 'tests' | 'metrics' | 'questions'} OutputKind
 * @typedef {'cheap' | 'balanced' | 'high-accuracy'} ModelHint
 * @typedef {'code_search' | 'test_runner' | 'adr_lookup' | 'repo_metadata' | 'coverage_report' | 'tracing' | `custom:${string}`} Dependency
 *
 * @typedef {Object} SkillMetadata
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {Phase} phase
 * @property {string[]} applyTo
 * @property {string[]=} files
 * @property {string[]=} tags
 * @property {Severity=} severity
 * @property {InputContext[]=} inputContext
 * @property {OutputKind[]=} outputKind
 * @property {ModelHint=} modelHint
 * @property {Dependency[]=} dependencies
 * @property {{phase?: Phase, applyTo?: string[], files?: string[]}=} trigger
 * @property {number=} priority
 *
 * @typedef {Object} SkillDefinition
 * @property {SkillMetadata} metadata
 * @property {string} body
 * @property {string} path
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const defaultSkillsDir = path.join(repoRoot, 'skills');
const defaultSchemaPath = path.join(repoRoot, 'schemas', 'skill.schema.json');
const markdownExtensions = new Set(['.md', '.mdx']);
const yamlExtensions = new Set(['.yaml', '.yml']);
const allowedExtensions = new Set([...markdownExtensions, ...yamlExtensions]);
const ignoredSkillDirNames = new Set([
  'agent-skills',
  'references',
  'fixtures',
  'golden',
  'eval',
  'prompt',
  'prompts',
]);
const ignoredFileNames = new Set(['.gitkeep', 'README.md', 'registry.yaml', 'registry.yml', '_template.md']);
const legacySkillFiles = new Set(['skill.yaml', 'skill.yml']);

export const defaultPaths = {
  repoRoot,
  skillsDir: defaultSkillsDir,
  schemaPath: defaultSchemaPath,
};

export class SkillLoaderError extends Error {
  constructor(message, details = undefined) {
    super(message);
    this.name = 'SkillLoaderError';
    this.details = details;
  }
}

export async function loadSchema(schemaPath = defaultSchemaPath) {
  const raw = await fs.readFile(schemaPath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new SkillLoaderError(`Failed to parse JSON schema at ${schemaPath}: ${err.message}`);
  }
}

export function createSkillValidator(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, useDefaults: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

export async function listSkillFiles(dir = defaultSkillsDir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  const hasLegacySkillFile = entries.some(entry => !entry.isDirectory() && legacySkillFiles.has(entry.name));
  if (hasLegacySkillFile) {
    const legacyEntry = entries.find(entry => !entry.isDirectory() && legacySkillFiles.has(entry.name));
    if (!legacyEntry) {
      throw new Error(`skill.yaml detected but not found in ${dir}`);
    }
    files.push(path.join(dir, legacyEntry.name));
    return files.sort((a, b) => a.localeCompare(b));
  }

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoredSkillDirNames.has(entry.name) || entry.name.startsWith('.')) {
        continue;
      }
      const nested = await listSkillFiles(entryPath);
      files.push(...nested);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!allowedExtensions.has(ext)) continue;
    if (ignoredFileNames.has(entry.name)) continue;
    if (entry.name.startsWith('_')) continue;
    files.push(entryPath);
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function normalizeMetadata(metadata) {
  const meta = { ...metadata };

  if (meta.priority !== undefined) {
    const parsedPriority = typeof meta.priority === 'string' ? Number(meta.priority) : meta.priority;
    if (Number.isFinite(parsedPriority)) {
      meta.priority = parsedPriority;
    } else {
      delete meta.priority;
    }
  }

  // Top-level alias first: applyTo has precedence over files.
  if (meta.files && !meta.applyTo) {
    meta.applyTo = meta.files;
  }

  const trigger =
    meta.trigger && typeof meta.trigger === 'object' && !Array.isArray(meta.trigger)
      ? meta.trigger
      : null;
  const triggerApplyTo = trigger?.applyTo ?? trigger?.files;

  if (!meta.phase && trigger?.phase) {
    meta.phase = trigger.phase;
  }
  if (!meta.applyTo && triggerApplyTo) {
    meta.applyTo = triggerApplyTo;
  }

  // Trigger is consumed during normalization; avoid leaking nested state.
  if (trigger) {
    delete meta.trigger;
  }

  return meta;
}

export function parseFrontMatter(content, { filePath } = {}) {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith('---')) {
    throw new SkillLoaderError('Missing front matter block (---)');
  }

  let parsed;
  try {
    parsed = matter(trimmed);
  } catch (err) {
    throw new SkillLoaderError(
      `Front matter parse error${filePath ? ` (${filePath})` : ''}: ${err.message}`
    );
  }

  const metadata = parsed.data ?? {};
  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new SkillLoaderError('Front matter must be a mapping');
  }
  if (Object.keys(metadata).length === 0) {
    throw new SkillLoaderError('Front matter is empty');
  }
  const normalized = normalizeMetadata(metadata);
  const body = (parsed.content ?? '').trim();
  return { metadata: normalized, body };
}

async function parseSkillFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!allowedExtensions.has(ext)) {
    throw new SkillLoaderError(`Unsupported skill file extension: ${ext}`);
  }
  const raw = await fs.readFile(filePath, 'utf8');
  if (markdownExtensions.has(ext)) {
    return parseFrontMatter(raw, { filePath });
  }

  // YAML handling
  let loaded = {};
  try {
    loaded = yaml.load(raw) ?? {};
  } catch (err) {
    throw new SkillLoaderError(`YAML parse error: ${err.message}`);
  }
  if (typeof loaded !== 'object' || Array.isArray(loaded)) {
    throw new SkillLoaderError('Skill YAML must be a mapping');
  }

  let metadata = loaded;
  let body = '';

  // Support nested metadata block
  if (loaded.metadata && typeof loaded.metadata === 'object' && !Array.isArray(loaded.metadata)) {
    metadata = { ...loaded.metadata };
    if (typeof metadata.instruction === 'string') {
      body = metadata.instruction;
      delete metadata.instruction;
    } else if (typeof loaded.instruction === 'string') {
      body = loaded.instruction;
    }
  } else if (typeof loaded.instruction === 'string') {
    // Support flat structure with optional instruction field
    body = loaded.instruction;
    delete metadata.instruction;
  }

  metadata = normalizeMetadata(metadata);
  return { metadata, body };
}

function validateMetadata(metadata, validate) {
  const metaCopy = JSON.parse(JSON.stringify(metadata ?? {}));
  const ok = validate(metaCopy);
  if (!ok) {
    const details = (validate.errors ?? []).map(err => `${err.instancePath || '/'} ${err.message}`).join('; ');
    throw new SkillLoaderError(`Validation failed: ${details}`, validate.errors);
  }
  return metaCopy;
}

function relativeToRepo(filePath) {
  return filePath.startsWith(repoRoot) ? path.relative(repoRoot, filePath) : filePath;
}

function logSkillLoadError(filePath, err) {
  const location = relativeToRepo(filePath);
  const reason = err instanceof Error ? err.message : String(err);
  console.error(`⚠️  Failed to load skill ${location}: ${reason}`);
  if (err?.details && Array.isArray(err.details)) {
    for (const detail of err.details) {
      const instance = detail.instancePath || '/';
      console.error(`   - ${instance}: ${detail.message}`);
    }
  }
}

function logDuplicateSkill(id, filePath, originalPath) {
  const location = relativeToRepo(filePath);
  const first = relativeToRepo(originalPath);
  console.warn(`⚠️  Duplicate skill id "${id}" in ${location}; already loaded from ${first}. Skipping.`);
}

function hasExcludedTag(metadata, excludedTags) {
  if (!excludedTags?.length) return false;
  const tags = metadata?.tags ?? [];
  return tags.some(tag => excludedTags.includes(tag));
}

export async function loadSkillFile(filePath, options = {}) {
  const { validator, schemaPath = defaultSchemaPath } = options;
  const compiledValidator = validator ?? createSkillValidator(await loadSchema(schemaPath));
  const parsed = await parseSkillFile(filePath);
  const metadata = validateMetadata(parsed.metadata, compiledValidator);
  return {
    metadata,
    body: parsed.body,
    path: filePath,
  };
}

export async function loadSkills(options = {}) {
  const {
    skillsDir = defaultSkillsDir,
    schemaPath = defaultSchemaPath,
    validator: providedValidator,
    excludedTags = ['agent'],
  } = options;
  const schema = providedValidator ? null : await loadSchema(schemaPath);
  const validator = providedValidator ?? createSkillValidator(schema);
  const files = await listSkillFiles(skillsDir);
  const skillsById = new Map();

  for (const filePath of files) {
    try {
      const skill = await loadSkillFile(filePath, { validator });
      const id = skill?.metadata?.id;
      if (!id) {
        logSkillLoadError(filePath, new SkillLoaderError('Missing id in skill metadata'));
        continue;
      }
      if (hasExcludedTag(skill.metadata, excludedTags)) {
        continue;
      }
      if (skillsById.has(id)) {
        logDuplicateSkill(id, filePath, skillsById.get(id).path);
        continue;
      }
      skillsById.set(id, skill);
    } catch (err) {
      logSkillLoadError(filePath, err);
    }
  }

  return Array.from(skillsById.values());
}
