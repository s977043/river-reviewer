# Claude Code Project Guide (river-reviewer)

> **Single source:** Rules are defined in [AGENTS.md](./AGENTS.md). This file contains only Claude-specific configurations.

## Critical Rules (Summary)

- **Security**: Do not access secrets (`.env`, `secrets/`).
- **Workflow**: `npm run lint` & `npm test` must pass before PR.
- **SSOT**: See `AGENTS.md` for tech stack, style guides, and definitions.

## Claude-specific

- **Permissions**: `.claude/settings.json` (See for allowed/denied commands)
- **Hooks**: `.claude/hooks/` (Auto-format on edit)
- **Sub-agent**: `river-reviewer` (in `.claude/agents/`)

## Custom Commands

- `/check` : Run quality checks (lint/test)
- `/pr` : Draft PR description
- `/skill` : Create skill definition
- `/review-local` : Self-review diff
- `/help` : List these commands details (check `.claude/commands/`)
