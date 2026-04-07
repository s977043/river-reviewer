# AGENTS.md — River Reviewer

## Scope

Canonical instructions for all AI coding agents in this repository.
Tool-specific files (`CLAUDE.md`, `GEMINI.md`, `.codex/`, `copilot-instructions.md`) contain only tool-specific policy and point here for repo-wide rules.
If a rule applies to all tools, it belongs in this file.

## Repository Map

| Directory                | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `skills/`                | Core review skills and registry content              |
| `skills/agent-skills/`   | Packaged agent skills (`SKILL.md` + `references/`)   |
| `src/`                   | Runtime, CLI, and runner logic                       |
| `tests/`                 | Node.js test suites                                  |
| `pages/`                 | Public docs; Japanese content is the source of truth |
| `docs/`                  | Internal notes and runbooks; ask before editing      |
| `runners/github-action/` | GitHub Action runner implementation                  |
| `runners/node-api/`      | Separate TypeScript package (built with `tsc`)       |
| `schemas/`               | JSON schemas for skills, output, and riverbed        |

## Package Manager

Use **npm**.

| Task                    | Command                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| Install                 | `npm install` or `npm ci`                                         |
| Lint                    | `npm run lint`                                                    |
| Test                    | `npm test`                                                        |
| Skills validation       | `npm run skills:validate`                                         |
| Agent skills validation | `npm run agent-skills:validate`                                   |
| Agent definitions       | `npm run agents:validate`                                         |
| Local link check        | `npm run check:links:local`                                       |
| Docs dev server         | `npm run dev`                                                     |
| Docs build              | `npm run build`                                                   |
| TypeScript check        | `npm run build` in `runners/node-api/` (no root typecheck script) |

## Safety

- Do not read or commit `.env*`, `secrets/`, `*.pem`, or `*.key`.
- Do not make direct network calls (curl, wget, fetch) from scripts or code. Allowed CLI tools like `gh` are exempt.
- Do not use destructive commands.
- Do not hand-edit `package-lock.json`.
- Do not push directly to `main` or to already-merged PR branches. If fixes are needed after merge, create a new branch and new PR.
- Do not omit timeout and exception handling in code that calls external APIs.

## Edit Scope

- **Editable**: `pages/`, `skills/`, `schemas/`, `scripts/`, `tests/`, `.github/`, `.claude/`, `AGENT_LEARNINGS.md`
- **Ask before editing**: `docs/`, `assets/`, `src/`, `runners/`, `README.md`, `README.en.md`, `AGENTS.md`
- **Never edit**: `package-lock.json`, `LICENSE*`, `CITATION.cff`

## Verification Criteria

Run the applicable checks before handoff. All must pass.

| Changed path                           | Required validation                |
| -------------------------------------- | ---------------------------------- |
| `skills/**/*.md`                       | `npm run skills:validate`          |
| `skills/agent-skills/**`               | `npm run agent-skills:validate`    |
| `.github/agents/` or `.claude/agents/` | `npm run agents:validate`          |
| `pages/**/*.md`                        | `npm run check:links:local`        |
| `src/` changes that affect skills      | Confirm schema and skill alignment |
| Any file                               | `npm run lint && npm test`         |

Completion gate: all applicable validations pass. If any fail, fix before handoff.

## Workflow

- Keep each change small and cohesive.
- If `src/` changes, confirm schema and skill alignment first.
- Run the verification criteria above before handoff.
- Prefer existing patterns over new conventions.

## Commit Attribution

AI-authored commits MUST include a `Co-Authored-By:` trailer with the acting model identity.

## Project Conventions

- `README.md` is the Japanese source of truth; `README.en.md` is best effort.
- `skills/` content is the product surface; validate it after edits.
- Record only durable, reusable repo learnings in `AGENT_LEARNINGS.md`.
- Use English or Japanese skill searches when locating repo conventions.

## Local References

- Core repository architecture: `docs/architecture.md`
- 4-layer agent architecture: `docs/agent-layers.md`
- Development runbook: `docs/runbook/dev.md`
- Skill structure: `skills/README.md`
