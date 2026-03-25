export const id = 213;
export const ids = [213];
export const modules = {

/***/ 9213:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   evaluateReviewFixtures: () => (/* binding */ evaluateReviewFixtures)
/* harmony export */ });
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3024);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6760);
/* harmony import */ var _diff_mjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4382);
/* harmony import */ var _review_engine_mjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5544);






function formatFailure(name, message) {
  return `[FAIL] ${name}: ${message}`;
}

function formatSuccess(name) {
  return `[PASS] ${name}`;
}

function expect(condition, name, message) {
  if (condition) return null;
  return formatFailure(name, message);
}

/**
 * Evaluate review fixtures (must_include checks).
 * @param {{
 *   casesPath: string
 *   phase?: string | null
 *   verbose?: boolean
 * }} options
 */
async function evaluateReviewFixtures({ casesPath, phase = null, verbose = false }) {
  const resolvedCasesPath = node_path__WEBPACK_IMPORTED_MODULE_1__.resolve(casesPath);
  const fixturesDir = node_path__WEBPACK_IMPORTED_MODULE_1__.dirname(resolvedCasesPath);
  const cases = JSON.parse(node_fs__WEBPACK_IMPORTED_MODULE_0__.readFileSync(resolvedCasesPath, 'utf8'));

  const failures = [];
  for (const c of cases) {
    const name = c.name ?? '(unnamed case)';
    const diffPath = node_path__WEBPACK_IMPORTED_MODULE_1__.resolve(fixturesDir, c.diffFile);
    const diffText = node_fs__WEBPACK_IMPORTED_MODULE_0__.readFileSync(diffPath, 'utf8');
    const parsedDiff = (0,_diff_mjs__WEBPACK_IMPORTED_MODULE_2__/* .parseUnifiedDiff */ .r)(diffText);
    const plan = {
      selected: (c.planSkills ?? []).map(id => ({ metadata: { id } })),
      skipped: [],
    };
    const diff = {
      diffText,
      files: parsedDiff.files,
      changedFiles: parsedDiff.files.map(f => f.path).filter(Boolean),
    };

    const result = await (0,_review_engine_mjs__WEBPACK_IMPORTED_MODULE_3__/* .generateReview */ .G1)({
      diff,
      plan,
      phase: phase ?? c.phase ?? 'midstream',
      dryRun: true,
      includeFallback: false,
    });

    const merged = result.comments.map(x => x.message).join('\n');
    const expectNoFindings = Boolean(c.expectNoFindings);
    const minFindings = Number.isFinite(c.minFindings) ? c.minFindings : expectNoFindings ? 0 : 1;
    const maxFindings = Number.isFinite(c.maxFindings) ? c.maxFindings : null;

    const checks = [
      expect(
        result.debug?.findingFormat?.ok !== false,
        name,
        'skill output format is invalid (missing labels or invalid Severity/Confidence)',
      ),
      expect(
        result.comments.length >= minFindings,
        name,
        `expected at least ${minFindings} findings, got ${result.comments.length}`,
      ),
      maxFindings == null
        ? null
        : expect(result.comments.length <= maxFindings, name, `too many findings: ${result.comments.length}`),
    ].filter(Boolean);

    for (const token of c.mustInclude ?? []) {
      checks.push(expect(merged.includes(token), name, `missing token: ${token}`));
    }

    const caseFailures = checks.filter(Boolean);
    failures.push(...caseFailures);

    if (verbose) {
      console.log(caseFailures.length ? formatFailure(name, `${caseFailures.length} checks failed`) : formatSuccess(name));
      if (caseFailures.length) {
        caseFailures.forEach(line => console.log(`  ${line}`));
      }
    } else {
      console.log(caseFailures.length ? formatFailure(name, caseFailures[0]) : formatSuccess(name));
    }
  }

  if (failures.length) {
    console.error(`\n${failures.length} fixture checks failed.`);
    return 1;
  }

  console.log('\nAll review fixtures passed.');
  return 0;
}


/***/ })

};

//# sourceMappingURL=213.index.mjs.map