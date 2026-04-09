# Design Philosophy

River Reviewer is built to deliver timely, phase-aware feedback without slowing teams down.

- **Flow-first**: every check should state which phase it belongs to and why.
- **Small, testable steps**: prefer narrowly scoped skills with clear acceptance signals.
- **Schema-driven**: `/schemas/skill.schema.json` is the contract for all skills and should stay the single source of truth.
- **Empathetic tone**: findings should be actionable and constructive, matching the friendly river brand.
- **Evidence-based**: link guidance to commands or links that prove the recommendation.
- **Context-aware**: systematically design the context passed to the LLM. Maximize review quality within a bounded context budget through skill selection, diff filtering, and progressive disclosure.

## Non-Goals

River Reviewer does **not** aim to be:

- **A general-purpose AI agent framework**: it is a context engineering framework specialized for code review, not a generic task execution platform.
- **A replacement for human review judgment**: AI assists by surfacing review perspectives and evidence, but final decisions are made by humans.
- **An automatic code fixer**: it identifies and reports issues but does not transform or auto-fix code.
