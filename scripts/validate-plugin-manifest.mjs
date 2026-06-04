import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');

async function readJson(filePath) {
  const raw = await fs.readFile(path.join(ROOT, filePath), 'utf8');
  return JSON.parse(raw);
}

async function pathExists(relPath) {
  try {
    await fs.access(path.join(ROOT, relPath));
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize a plugin-manifest path reference (e.g. "./.claude/commands/pr.md")
 * to a repo-relative path.
 */
function normalizeRef(ref) {
  return ref.replace(/^\.\//, '');
}

/**
 * Validate the Claude Code + Codex plugin manifests and the marketplace
 * manifest against the repository:
 *  - every component path referenced by .claude-plugin/plugin.json exists
 *  - .claude-plugin and .codex-plugin manifest versions match package.json
 *  - marketplace plugins[].name matches the plugin manifest name
 *  - the Codex manifest's skills path exists
 *
 * Returns array of error strings (empty = pass).
 */
export async function validatePluginManifest() {
  const errors = [];

  const pkg = await readJson('package.json');
  const ccManifest = await readJson('.claude-plugin/plugin.json');
  const marketplace = await readJson('.claude-plugin/marketplace.json');

  // --- Claude Code manifest: version sync ---
  if (ccManifest.version !== pkg.version) {
    errors.push(
      `.claude-plugin/plugin.json: version "${ccManifest.version}" !== package.json "${pkg.version}"`
    );
  }

  // --- Claude Code manifest: component paths exist ---
  const refs = [];
  for (const cmd of ccManifest.commands || []) refs.push(cmd);
  if (typeof ccManifest.agents === 'string') refs.push(ccManifest.agents);
  else for (const a of ccManifest.agents || []) refs.push(a);
  if (typeof ccManifest.skills === 'string') refs.push(ccManifest.skills);
  if (typeof ccManifest.hooks === 'string') refs.push(ccManifest.hooks);

  for (const ref of refs) {
    const rel = normalizeRef(ref);
    if (!(await pathExists(rel))) {
      errors.push(`.claude-plugin/plugin.json: referenced path does not exist: ${ref}`);
    }
  }

  // --- Marketplace: plugins[].name matches manifest name ---
  const entry = (marketplace.plugins || []).find((p) => p.name === ccManifest.name);
  if (!entry) {
    errors.push(
      `.claude-plugin/marketplace.json: no plugins[] entry with name "${ccManifest.name}"`
    );
  }

  // --- Codex manifest (required: official distribution ships Codex too) ---
  if (!(await pathExists('.codex-plugin/plugin.json'))) {
    errors.push('.codex-plugin/plugin.json: missing (required for Codex plugin distribution)');
  } else {
    const codexManifest = await readJson('.codex-plugin/plugin.json');
    if (codexManifest.version !== pkg.version) {
      errors.push(
        `.codex-plugin/plugin.json: version "${codexManifest.version}" !== package.json "${pkg.version}"`
      );
    }
    if (codexManifest.name !== ccManifest.name) {
      errors.push(
        `.codex-plugin/plugin.json: name "${codexManifest.name}" !== .claude-plugin name "${ccManifest.name}"`
      );
    }
    if (typeof codexManifest.skills !== 'string') {
      errors.push('.codex-plugin/plugin.json: "skills" path is missing or not a string');
    } else {
      const rel = normalizeRef(codexManifest.skills);
      if (!(await pathExists(rel))) {
        errors.push(
          `.codex-plugin/plugin.json: skills path does not exist: ${codexManifest.skills}`
        );
      }
    }
    // The Codex plugin UI requires an interface block with these fields.
    const iface = codexManifest.interface;
    if (!iface || typeof iface !== 'object') {
      errors.push('.codex-plugin/plugin.json: "interface" block is missing');
    } else {
      const requiredInterfaceFields = [
        'displayName',
        'shortDescription',
        'longDescription',
        'category',
        'capabilities',
      ];
      for (const field of requiredInterfaceFields) {
        if (iface[field] === undefined || iface[field] === null || iface[field] === '') {
          errors.push(`.codex-plugin/plugin.json: interface.${field} is missing or empty`);
        }
      }
      if (iface.capabilities !== undefined && !Array.isArray(iface.capabilities)) {
        errors.push('.codex-plugin/plugin.json: interface.capabilities must be an array');
      }
    }
  }

  return errors;
}

// CLI entry point
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('validate-plugin-manifest.mjs') ||
    process.argv[1].endsWith('validate-plugin-manifest'));

if (isDirectRun) {
  validatePluginManifest()
    .then((errors) => {
      if (errors.length === 0) {
        console.log('Plugin manifest: OK');
        return 0;
      }
      console.error(`Plugin manifest: ${errors.length} error(s) found`);
      for (const err of errors) {
        console.error(`  - ${err}`);
      }
      return 1;
    })
    .then((code) => {
      if (code !== 0) process.exitCode = code;
    })
    .catch((err) => {
      console.error(`Plugin manifest check failed: ${err.message}`);
      process.exitCode = 1;
    });
}
