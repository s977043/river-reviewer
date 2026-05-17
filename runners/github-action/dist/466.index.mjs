export const id = 466;
export const ids = [466];
export const modules = {

/***/ 7466:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   formatReviewPlanSummaryMarkdown: () => (/* binding */ formatReviewPlanSummaryMarkdown)
/* harmony export */ });
/**
 * Human-readable Markdown summary for a `river review plan` Review
 * Artifact (#802 Phase 3). Pure formatter — no I/O. The CLI writes the
 * result to `--summary-file`; the JSON Review Artifact remains the
 * machine-readable contract and is unaffected.
 */

function bullet(line) {
  return `- ${line}`;
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
    ...(selected.length
      ? selected.map((s) => bullet(`\`${s.id}\` — ${s.name}`))
      : ['_None._']),
    '',
    `## Skipped skills (${skipped.length})`,
    '',
    ...(skipped.length
      ? skipped.map((s) => bullet(`\`${s.id}\`: ${(s.reasons ?? []).join('; ')}`))
      : ['_None._']),
    '',
  ];
  return lines.join('\n');
}


/***/ })

};

//# sourceMappingURL=466.index.mjs.map