/**
 * Detect high-risk patterns in configuration file changes.
 *
 * @param {{ file: string, diff: string }[]} configChanges - Array of config file diffs
 * @returns {{ risks: { file: string, pattern: string, severity: 'info'|'warning'|'critical' }[], riskLevel: 'low'|'medium'|'high' }}
 */
export function detectConfigRisks(configChanges) {
  const risks = [];

  for (const { file, diff } of configChanges) {
    const lines = diff.split('\n');
    const basename = file.split('/').pop() ?? '';

    for (const line of lines) {
      // Removed environment variables
      if (line.startsWith('-') && /[A-Z_]{2,}=/.test(line) && !line.startsWith('---')) {
        risks.push({ file, pattern: 'Removed environment variable', severity: 'warning' });
      }

      // Secrets/tokens in added lines
      if (line.startsWith('+') && !line.startsWith('+++')) {
        if (/(?:secret|token|password|api_?key|private_?key)/i.test(line)) {
          // Only flag if it looks like an actual value, not a variable reference
          if (!line.includes('process.env') && !line.includes('${') && !line.includes('EXAMPLE')) {
            risks.push({ file, pattern: 'Possible secret in config', severity: 'critical' });
          }
        }
      }

      // Port changes
      if (line.startsWith('+') && /\bport\b/i.test(line) && /\d{4,5}/.test(line)) {
        risks.push({ file, pattern: 'Port configuration changed', severity: 'info' });
      }
    }

    // CI workflow changes are inherently risky
    if (file.startsWith('.github/workflows/')) {
      // Check for permission changes
      if (diff.includes('permissions:')) {
        risks.push({ file, pattern: 'CI workflow permissions changed', severity: 'warning' });
      }
      // Check for new secret usage
      if (/^\+.*secrets\./m.test(diff)) {
        risks.push({ file, pattern: 'New secret reference in CI', severity: 'warning' });
      }
    }

    // Docker changes
    if (basename.startsWith('Dockerfile') || basename.startsWith('docker-compose')) {
      if (/^\+.*(?:EXPOSE|ports:)/m.test(diff)) {
        risks.push({ file, pattern: 'Container port exposure changed', severity: 'info' });
      }
      if (/^\+.*(?:privileged|cap_add)/m.test(diff)) {
        risks.push({ file, pattern: 'Container privilege escalation', severity: 'critical' });
      }
    }
  }

  // Deduplicate
  const unique = [];
  const seen = new Set();
  for (const risk of risks) {
    const key = `${risk.file}:${risk.pattern}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(risk);
    }
  }

  const hasCritical = unique.some((r) => r.severity === 'critical');
  const hasWarning = unique.some((r) => r.severity === 'warning');
  const riskLevel = hasCritical ? 'high' : hasWarning ? 'medium' : 'low';

  return { risks: unique, riskLevel };
}
