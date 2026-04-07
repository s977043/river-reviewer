/**
 * Analyze dependency changes from a unified diff of package.json.
 *
 * @param {string} diffText - Unified diff text (or just the package.json portion)
 * @returns {{ added: string[], removed: string[], changed: string[], riskLevel: 'low'|'medium'|'high' }}
 */
export function analyzeDependencyImpact(diffText) {
  const added = [];
  const removed = [];
  const changed = [];

  const lines = diffText.split('\n');
  for (const line of lines) {
    // Match lines like: +    "lodash": "^4.17.21",  or  -    "lodash": "^4.17.20",
    const addMatch = /^\+\s+"([^"]+)":\s*"([^"]+)"/.exec(line);
    const removeMatch = /^-\s+"([^"]+)":\s*"([^"]+)"/.exec(line);

    if (addMatch && !line.startsWith('+++')) {
      const [, name] = addMatch;
      // Check if this package also has a removal (= version change)
      const wasRemoved = removed.findIndex((r) => r === name);
      if (wasRemoved >= 0) {
        removed.splice(wasRemoved, 1);
        changed.push(name);
      } else {
        added.push(name);
      }
    } else if (removeMatch && !line.startsWith('---')) {
      const [, name] = removeMatch;
      // Check if already added (= version change, processed in reverse order)
      const wasAdded = added.findIndex((a) => a === name);
      if (wasAdded >= 0) {
        added.splice(wasAdded, 1);
        changed.push(name);
      } else {
        removed.push(name);
      }
    }
  }

  // Risk assessment
  let riskLevel = 'low';
  if (removed.length > 0) riskLevel = 'medium';
  if (removed.length > 3 || added.length > 5) riskLevel = 'high';
  // Major version bumps in changed deps are high risk
  // (simplified: any change counts as medium at minimum)
  if (changed.length > 0 && riskLevel === 'low') riskLevel = 'medium';

  return { added, removed, changed, riskLevel };
}
