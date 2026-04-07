import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeDependencyImpact } from '../src/lib/dependency-impact.mjs';

test('analyzeDependencyImpact detects added dependency', () => {
  const diff = `
--- a/package.json
+++ b/package.json
@@ -10,6 +10,7 @@
     "express": "^4.18.0",
+    "lodash": "^4.17.21",
     "react": "^18.2.0"
`;
  const result = analyzeDependencyImpact(diff);
  assert.deepEqual(result.added, ['lodash']);
  assert.deepEqual(result.removed, []);
  assert.deepEqual(result.changed, []);
});

test('analyzeDependencyImpact detects removed dependency', () => {
  const diff = `
--- a/package.json
+++ b/package.json
@@ -10,7 +10,6 @@
     "express": "^4.18.0",
-    "lodash": "^4.17.21",
     "react": "^18.2.0"
`;
  const result = analyzeDependencyImpact(diff);
  assert.deepEqual(result.added, []);
  assert.deepEqual(result.removed, ['lodash']);
  assert.deepEqual(result.changed, []);
});

test('analyzeDependencyImpact detects version change (remove then add)', () => {
  const diff = `
--- a/package.json
+++ b/package.json
@@ -10,7 +10,7 @@
     "express": "^4.18.0",
-    "lodash": "^4.17.20",
+    "lodash": "^4.17.21",
     "react": "^18.2.0"
`;
  const result = analyzeDependencyImpact(diff);
  assert.deepEqual(result.added, []);
  assert.deepEqual(result.removed, []);
  assert.deepEqual(result.changed, ['lodash']);
});

test('analyzeDependencyImpact detects version change (add then remove order)', () => {
  // Some diffs might show the add before the remove
  const diff = `
--- a/package.json
+++ b/package.json
@@ -10,7 +10,7 @@
     "express": "^4.18.0",
+    "axios": "^1.6.0",
-    "axios": "^1.5.0",
     "react": "^18.2.0"
`;
  const result = analyzeDependencyImpact(diff);
  assert.deepEqual(result.added, []);
  assert.deepEqual(result.removed, []);
  assert.deepEqual(result.changed, ['axios']);
});

test('analyzeDependencyImpact returns empty for empty diff', () => {
  const result = analyzeDependencyImpact('');
  assert.deepEqual(result.added, []);
  assert.deepEqual(result.removed, []);
  assert.deepEqual(result.changed, []);
  assert.equal(result.riskLevel, 'low');
});

test('analyzeDependencyImpact risk level: low for adds only (few)', () => {
  const diff = `
+    "lodash": "^4.17.21",
+    "axios": "^1.6.0",
`;
  const result = analyzeDependencyImpact(diff);
  assert.equal(result.riskLevel, 'low');
  assert.equal(result.added.length, 2);
});

test('analyzeDependencyImpact risk level: medium for removals', () => {
  const diff = `
-    "lodash": "^4.17.21",
`;
  const result = analyzeDependencyImpact(diff);
  assert.equal(result.riskLevel, 'medium');
});

test('analyzeDependencyImpact risk level: medium for version changes', () => {
  const diff = `
-    "lodash": "^4.17.20",
+    "lodash": "^4.17.21",
`;
  const result = analyzeDependencyImpact(diff);
  assert.equal(result.riskLevel, 'medium');
  assert.deepEqual(result.changed, ['lodash']);
});

test('analyzeDependencyImpact risk level: high for many removals', () => {
  const diff = `
-    "a": "^1.0.0",
-    "b": "^1.0.0",
-    "c": "^1.0.0",
-    "d": "^1.0.0",
`;
  const result = analyzeDependencyImpact(diff);
  assert.equal(result.riskLevel, 'high');
});

test('analyzeDependencyImpact risk level: high for many additions', () => {
  const diff = `
+    "a": "^1.0.0",
+    "b": "^1.0.0",
+    "c": "^1.0.0",
+    "d": "^1.0.0",
+    "e": "^1.0.0",
+    "f": "^1.0.0",
`;
  const result = analyzeDependencyImpact(diff);
  assert.equal(result.riskLevel, 'high');
  assert.equal(result.added.length, 6);
});

test('analyzeDependencyImpact ignores +++ and --- header lines', () => {
  const diff = `--- a/package.json
+++ b/package.json
@@ -1,5 +1,5 @@
+    "new-pkg": "^1.0.0",
`;
  const result = analyzeDependencyImpact(diff);
  assert.deepEqual(result.added, ['new-pkg']);
  assert.deepEqual(result.removed, []);
});
