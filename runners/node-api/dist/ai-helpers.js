/**
 * Pure AI provider helper functions for the River Reviewer Node API.
 * These helpers have no dependencies on @river-reviewer/core-runner
 * and can be tested in isolation.
 */
/** Parse "openai:gpt-4o" → { type: "openai", model: "gpt-4o" }. */
export function parseProvider(providerStr) {
    const idx = providerStr.indexOf(':');
    if (idx === -1)
        return { type: providerStr, model: 'gpt-4o' };
    return { type: providerStr.slice(0, idx), model: providerStr.slice(idx + 1) };
}
const SEVERITY_VALUES = new Set(['critical', 'major', 'minor', 'info']);
/**
 * Parse AI output into Finding objects.
 * Expects the structured format: **Finding:**, **Evidence:**, **Severity:**, etc.
 */
export function parseFindings(output, skillId, files) {
    const findings = [];
    const blocks = output.split(/(?=\*\*Finding:\*\*)/);
    for (const block of blocks) {
        if (!block.includes('**Finding:**'))
            continue;
        const findingMatch = block.match(/\*\*Finding:\*\*\s*(.+)/);
        if (!findingMatch)
            continue;
        const evidenceMatch = block.match(/\*\*Evidence:\*\*\s*(.+)/);
        const impactMatch = block.match(/\*\*Impact:\*\*\s*(.+)/);
        const fixMatch = block.match(/\*\*Fix:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/);
        const severityMatch = block.match(/\*\*Severity:\*\*\s*(\w+)/i);
        const rawSeverity = severityMatch?.[1]?.toLowerCase() ?? 'major';
        const severity = SEVERITY_VALUES.has(rawSeverity)
            ? rawSeverity
            : 'major';
        const messageParts = [findingMatch[1].trim()];
        if (evidenceMatch)
            messageParts.push(`Evidence: ${evidenceMatch[1].trim()}`);
        if (impactMatch)
            messageParts.push(`Impact: ${impactMatch[1].trim()}`);
        const message = messageParts.join('\n');
        const suggestion = fixMatch?.[1]?.trim() || undefined;
        const lineMatch = evidenceMatch?.[1]?.match(/[Ll]ine\s+(\d+)/);
        const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
        findings.push({
            file: files[0] ?? 'unknown',
            line,
            message,
            severity,
            skillId,
            suggestion,
        });
    }
    return findings;
}
//# sourceMappingURL=ai-helpers.js.map