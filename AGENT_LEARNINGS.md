# AGENT_LEARNINGS.md — River Reviewer

## Purpose

- Store durable, reusable repo-specific learnings for future agents.
- Keep this file focused on facts that help across branches and sessions.

## Write Rules

- Add only stable observations that have been verified in the repository.
- Capture one learning per bullet with enough context to reuse it.
- Record secrets, personal data, transient debugging notes, and branch-specific TODOs nowhere in this file.
- Prefer facts that change slowly: command shapes, package boundaries, validation rules, source-of-truth files, and recurring pitfalls.

## Entry Format

- `YYYY-MM-DD`: short learning statement.
- `Applies to`: where the learning matters.
- `Evidence`: file or command that confirmed it.

## Current Learnings

- `2026-04-03`: `README.md` is the Japanese source of truth, and `README.en.md` is best effort only.
  - `Applies to`: docs updates, content parity checks, and agent instructions.
  - `Evidence`: repository README files and existing project guidance.
- `2026-04-03`: The root package uses `npm`; validation is `npm run lint` and `npm test`, while the root has no `typecheck` script.
  - `Applies to`: routine verification and agent planning.
  - `Evidence`: root `package.json`.
- `2026-04-03`: `runners/node-api/` is a separate TypeScript package and its compile check is `npm run build` (`tsc`) inside that directory.
  - `Applies to`: changes to the Node API runner or its published types.
  - `Evidence`: `runners/node-api/package.json`.
