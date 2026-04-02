# AGENTS.md—River Reviewer

## Scope

- Canonical instructions for all AI coding agents in this repository.
- Tool-specific files like `CLAUDE.md` stay thin and point here.

## Repository Map

- `skills/`: core review skills and registry content.
- `skills/agent-skills/`: packaged agent skills with `SKILL.md` plus `references/`.
- `src/`: runtime, CLI, and runner logic.
- `tests/`: Node.js test suites.
- `pages/`: public docs; Japanese content is the source of truth.
- `docs/`: internal notes and runbooks; ask before editing.
- `runners/node-api/`: separate TypeScript package built with `tsc`.

## Package Manager

Use **npm**.

- Install: `npm install` or `npm ci`
- Lint: `npm run lint`
- Test: `npm test`
- Skills: `npm run skills:validate`
- Agent skills: `npm run agent-skills:validate`
- Agent definitions: `npm run agents:validate`
- Local docs links: `npm run check:links:local`
- Docs dev server: `npm run dev`
- Docs build: `npm run build`
- TypeScript type check: no root `typecheck` script exists; use `npm run build` in `runners/node-api/` when that package changes.

## Safety

- Do not read or commit `.env*`, `secrets/`, `*.pem`, or `*.key`.
- Do not access the external network from commands.
- Do not use destructive commands.
- Do not hand-edit `package-lock.json`.
- Do not push directly to `main` or to already-merged PR branches.
- Do not omit timeout and exception handling in code that calls external APIs.

## Edit Scope

- Editable: `pages/`, `skills/`, `schemas/`, `scripts/`, `tests/`, `.github/`, `.claude/`
- Ask before editing: `docs/`, `assets/`, `src/`
- Never edit: `package-lock.json`, `LICENSE*`, `CITATION.cff`

## Workflow

- Keep each change small and cohesive.
- If `src/` changes, confirm schema and skill alignment first.
- Run the required checks before handoff.
- Prefer existing patterns over new conventions.

## Commit Attribution

- AI-authored commits MUST include a `Co-Authored-By:` trailer with the acting model identity.

## Project Conventions

- `README.md` is the Japanese source of truth; `README.en.md` is best effort.
- `skills/` content is the product surface; validate it after edits.
- Record only durable, reusable repo learnings in `AGENT_LEARNINGS.md`.
- Use English or Japanese skill searches when locating repo conventions.

## Local References

- Core repository architecture: `docs/architecture.md`
- Development runbook: `docs/runbook/dev.md`
- Skill structure: `skills/README.md`
