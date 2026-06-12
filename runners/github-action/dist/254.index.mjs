export const id = 254;
export const ids = [254];
export const modules = {

/***/ 7254:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   formatReviewPlanSummaryMarkdown: () => (/* binding */ formatReviewPlanSummaryMarkdown)
/* harmony export */ });
/**
 * Human-readable Markdown summary for a `river review plan` Review
 * Artifact (#802 Phase 3). Pure formatter — no I/O. The CLI writes the
 * result to `--summary-file` and to stdout/`--output-file` for
 * `--output markdown` (#976 gap). The JSON Review Artifact remains the
 * machine-readable contract and is unaffected.
 */

function bullet(line) {
  return `- ${line}`;
}

function findingLine(f) {
  const sev = f?.severity ?? 'info';
  const loc = f?.line ? `${f.file ?? '?'}:${f.line}` : (f?.file ?? '?');
  const title = f?.title || f?.message || '';
  const oneLine = String(title).replace(/\s+/g, ' ').trim().slice(0, 200);
  return bullet(`[${sev}] \`${loc}\` — ${oneLine}`);
}

/**
 * @param {object} artifact Review Artifact (schema version "1")
 * @returns {string} Markdown summary
 */
function formatReviewPlanSummaryMarkdown(artifact) {
  const plan = artifact?.plan ?? {};
  const selected = Array.isArray(plan.selectedSkills) ? plan.selectedSkills : [];
  const skipped = Array.isArray(plan.skippedSkills) ? plan.skippedSkills : [];

  const lines = [
    '# river review plan',
    '',
    `- Status: \`${artifact?.status ?? 'unknown'}\``,
    `- Phase: \`${artifact?.phase ?? 'unknown'}\``,
    `- Planner mode: \`${plan.plannerMode ?? 'off'}\``,
    '',
    `## Selected skills (${selected.length})`,
    '',
    ...(selected.length ? selected.map((s) => bullet(`\`${s.id}\` — ${s.name}`)) : ['_None._']),
    '',
    `## Skipped skills (${skipped.length})`,
    '',
    ...(skipped.length
      ? skipped.map((s) => bullet(`\`${s.id}\`: ${(s.reasons ?? []).join('; ')}`))
      : ['_None._']),
    '',
  ];

  const findings = Array.isArray(artifact?.findings) ? artifact.findings : [];
  if (findings.length) {
    lines.push(`## Findings (${findings.length})`, '', ...findings.map(findingLine), '');
  }

  return lines.join('\n');
}


/***/ })

};

//# sourceMappingURL=254.index.mjs.map