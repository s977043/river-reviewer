import fs from 'node:fs';
import path from 'node:path';

/**
 * Load the Riverbed Memory index from disk.
 * Returns empty structure if file doesn't exist (stateless fallback).
 *
 * @param {string} indexPath - Path to the index.json file
 * @returns {{ entries: object[], version: string }}
 */
export function loadMemory(indexPath) {
  try {
    const raw = fs.readFileSync(indexPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { entries: [], version: '1' };
    }
    throw err;
  }
}

/**
 * Append a memory entry to the index.
 * Creates the directory and file if they don't exist.
 *
 * @param {string} indexPath - Path to the index.json file
 * @param {object} entry - Entry conforming to riverbed-entry.schema.json
 */
export function appendEntry(indexPath, entry) {
  const index = loadMemory(indexPath);

  // Validate required fields
  if (!entry.id || !entry.type || !entry.content || !entry.metadata) {
    throw new Error('Entry must have id, type, content, and metadata fields');
  }

  // Prevent duplicate IDs
  if (index.entries.some((e) => e.id === entry.id)) {
    throw new Error(`Duplicate entry ID: ${entry.id}`);
  }

  index.entries.push(entry);

  const dir = path.dirname(indexPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
}

/**
 * Query memory entries by filter criteria.
 * All filter fields are optional; entries must match ALL provided criteria.
 *
 * @param {{ entries: object[] }} index - Loaded memory index
 * @param {{ type?: string, tags?: string[], phase?: string }} filter
 * @returns {object[]}
 */
export function queryMemory(index, { type, tags, phase } = {}) {
  return index.entries.filter((entry) => {
    if (type && entry.type !== type) return false;
    if (phase && entry.metadata?.phase !== phase) return false;
    if (tags && tags.length > 0) {
      const entryTags = entry.metadata?.tags ?? [];
      if (!tags.every((t) => entryTags.includes(t))) return false;
    }
    return true;
  });
}
