/**
 * Pure AI provider helper functions for the River Reviewer Node API.
 * These helpers have no dependencies on @river-reviewer/core-runner
 * and can be tested in isolation.
 */
import type { Finding } from './types.js';
/** Parse "openai:gpt-4o" → { type: "openai", model: "gpt-4o" }. */
export declare function parseProvider(providerStr: string): {
    type: string;
    model: string;
};
/**
 * Parse AI output into Finding objects.
 * Expects the structured format: **Finding:**, **Evidence:**, **Severity:**, etc.
 */
export declare function parseFindings(output: string, skillId: string, files: string[]): Finding[];
//# sourceMappingURL=ai-helpers.d.ts.map