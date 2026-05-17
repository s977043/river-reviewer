// tests/helpers/schema-validator.mjs
//
// Shared Ajv 2020 validator factory for test suites. Compiling a schema
// is non-trivial, so call these once at module scope and reuse the
// compiled validator across tests rather than recompiling per test.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const SCHEMAS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'schemas');

/**
 * Compile a JSON schema into an Ajv validator.
 * @param {object} schema
 * @returns {import('ajv').ValidateFunction}
 */
export function compileSchema(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

/**
 * Load and compile a schema file from schemas/.
 * @param {string} fileName e.g. "review-artifact.schema.json"
 */
export function compileSchemaFile(fileName) {
  const schema = JSON.parse(readFileSync(resolve(SCHEMAS_DIR, fileName), 'utf8'));
  return compileSchema(schema);
}

/** Compiled validator for schemas/review-artifact.schema.json. */
export function compileReviewArtifactValidator() {
  return compileSchemaFile('review-artifact.schema.json');
}
