# AGENT_LEARNINGS.md — River Reviewer

## Purpose

- Store durable, reusable repo-specific learnings for future agents.
- Keep this file focused on facts that help across branches and sessions.

## Write Rules

- Add only stable observations that have been verified in the repository.
- Capture one learning per bullet with enough context to reuse it.
- Record secrets, personal data, transient debugging notes, and branch-specific TODOs nowhere in this file.
- Prefer facts that change slowly: command shapes, package boundaries, validation rules, source-of-truth files, and recurring pitfalls.
- Do not duplicate facts already stated in `AGENTS.md`. Only record what is not obvious from the canonical instructions.
- Remove or update entries when the underlying fact changes. Review during major refactors.

## Entry Format

- `YYYY-MM-DD`: short learning statement.
- `Applies to`: where the learning matters.
- `Evidence`: file or command that confirmed it.

## Current Learnings

- `2026-04-03`: LLM feature guards use `isLlmEnabled()` from `src/lib/utils.mjs`. It checks both OpenAI (`OPENAI_API_KEY`, `RIVER_OPENAI_API_KEY`) and Google Gemini (`GOOGLE_API_KEY`) keys.
  - `Applies to`: any code that conditionally enables LLM-powered features.
  - `Evidence`: `src/lib/utils.mjs`, `src/lib/local-runner.mjs`, `src/core/skill-dispatcher.mjs`.
- `2026-04-03`: Use Git Worktrees for parallel agent tasks. Setup and teardown steps are documented in `docs/runbook/dev.md` § 並行タスク。
  - `Applies to`: concurrent branch work and multi-agent workflows.
  - `Evidence`: `docs/runbook/dev.md` lines 32-45.
