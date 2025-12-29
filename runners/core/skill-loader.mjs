#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
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
const allowedExtensions = new Set(['.md', '.mdx', '.yaml', '.yml']);
const ignoredSkillDirNames = new Set(['agent-skills']);

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

  // Check if this directory contains a skill.yaml file (new directory structure)
  const hasSkillYaml = entries.some(
    entry => !entry.isDirectory() && (entry.name === 'skill.yaml' || entry.name === 'skill.yml')
  );

  // If skill.yaml exists, only include that file and skip other files and subdirectories in this directory
  if (hasSkillYaml) {
    const skillYamlEntry = entries.find(
      entry => !entry.isDirectory() && (entry.name === 'skill.yaml' || entry.name === 'skill.yml')
    );
    if (!skillYamlEntry) {
      throw new Error(`skill.yaml detected but not found in ${dir}`);
    }
    files.push(path.join(dir, skillYamlEntry.name));
    return files.sort();
  }

  // Otherwise, process files and subdirectories normally (legacy structure)
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoredSkillDirNames.has(entry.name)) {
        continue;
      }
      const nested = await listSkillFiles(entryPath);
      files.push(...nested);
    } else if (
      allowedExtensions.has(path.extname(entry.name)) &&
      !['.gitkeep', 'README.md', 'registry.yaml'].includes(entry.name) &&
      !entry.name.startsWith('_')
    ) {
      files.push(entryPath);
    }
  }
  return files.sort();
}

function normalizeMetadata(metadata) {
  const meta = { ...metadata };

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

export function parseFrontMatter(content) {
  if (!content.startsWith('---')) {
    throw new SkillLoaderError('Missing front matter block (---)');
  }
  const end = content.indexOf('\n---', 3);
  if (end === -1) {
    throw new SkillLoaderError('Unterminated front matter block');
  }
  const yamlBlock = content.slice(3, end).trim();
  if (!yamlBlock) {
    throw new SkillLoaderError('Front matter is empty');
  }
  let metadata = {};
  try {
    metadata = yaml.load(yamlBlock) ?? {};
  } catch (err) {
    throw new SkillLoaderError(`Front matter YAML parse error: ${err.message}`);
  }
  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new SkillLoaderError('Front matter must be a mapping');
  }
  metadata = normalizeMetadata(metadata);
  const body = content.slice(end + 4);
  return { metadata, body };
}

async function parseSkillFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!allowedExtensions.has(ext)) {
    throw new SkillLoaderError(`Unsupported skill file extension: ${ext}`);
  }
  const raw = await fs.readFile(filePath, 'utf8');
  if (ext === '.md' || ext === '.mdx') {
    return parseFrontMatter(raw);
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
  } = options;
  const schema = providedValidator ? null : await loadSchema(schemaPath);
  const validator = providedValidator ?? createSkillValidator(schema);
  const files = await listSkillFiles(skillsDir);
  return Promise.all(files.map(filePath => loadSkillFile(filePath, { validator })));
}
