# River Reviewer Glossary

- **Upstream**: requirements, design, and architecture phase (including ADRs) where early review prevents costly rework.
- **Midstream**: implementation and pull request phase focused on code quality, security, and developer experience.
- **Downstream**: test/QA/release-prep phase. Verify coverage and resilience, and prevent regressions. Ensure AI review aligns with release readiness.
- **Skill**: a YAML frontmatter + Markdown unit of review guidance executed by River Reviewer.
- **Stream Router**: logic that selects and runs skills based on the requested phase and change context.
- **Riverbed Memory (Future)**: persistent context layer for previous findings, ADR references, and WontFix decisions to keep reviews consistent over time.
- **Context Engineering**: the discipline of systematically designing, selecting, and controlling the context passed to an LLM. The focus is on what to load, when, and at what fidelity—not on prompt wording.
- **Context Budget**: the upper bound on tokens available for a single review run. Skills, diffs, and memory are selected to maximize review quality within this budget.
- **Attention Budget**: a context allocation strategy that concentrates LLM attention on high-signal information by excluding low-signal noise so that important findings are not buried.
- **Progressive Disclosure**: a staged loading strategy that provides context at increasing levels of detail only when needed. Metadata is loaded first; full skill instructions are loaded only for selected skills.
- **Review Artifact**: a structured output record of a review run. It includes the plan (selected/skipped skills), findings, decisions, and debug information, and serves as input for auditing, memory ingestion, and evaluation.
