# Claude Code Project Guide (river-reviewer)

> **Repo rules**: Follow all sections in [AGENTS.md](./AGENTS.md). This file adds only Claude Code-specific work policy.

<!-- Maintenance: repo-wide rules belong in AGENTS.md.
     Only Claude Code behavior policy belongs here.
     Never restate AGENTS.md content. -->

## Decision Policy

- **Proceed autonomously**: read-only exploration, running commands listed in `.claude/settings.json` allow list, editing paths in AGENTS.md "Editable" scope.
- **Ask before acting**: editing paths in AGENTS.md "Ask before editing" scope, adding dependencies, running commands not in allow list.
- **Always ask**: architectural changes, modifying AGENTS.md or CLAUDE.md, any destructive git operation, changes touching `src/` that may break skill or schema alignment.

## Change Policy

- One logical change per branch. Do not bundle unrelated fixes.
- Minimal diff — do not refactor, reformat, or annotate code outside the task scope.
- Do not add features, patterns, or dependencies not explicitly requested.
- If a task seems too large for one session, propose a plan and get approval first.

## Reporting

After completing a task, state concisely:

1. What changed (files and purpose).
2. What was verified (commands run and results).
3. What needs human review (assumptions, edge cases, "ask before" paths touched).

If a check fails, show the failure output and proposed fix before applying.

## AI Misoperation Guards

- **Read before referencing**: Do not cite file contents, function names, or line numbers without first reading the file.
- **Run before claiming**: Do not assert that tests pass or lint succeeds without running the command and showing output.
- **No silent skips**: If a required validation fails, report it — do not silently omit it from the report.
- **Search before inventing**: When uncertain about a convention, search `skills/`, `docs/`, and existing code before creating a new pattern.
- **Diff only what exists**: In reviews, do not comment on code that is not in the diff.
- **Research before proposing**: Do not create GitHub issues without first confirming the feature is not already implemented. See `/propose-issue`.
- **Propagate signatures**: When adding parameters to pipeline functions (`generateReview`, `verifyFinding`, `buildExecutionPlan`), consult `docs/development/pipeline-params-checklist.md` to avoid call-site gaps.
- **Plan merge order**: When creating multiple PRs that touch overlapping files, run `/plan-merge-order` before merging to minimize rebase cost.

## Tooling

| Component   | Location                           | Behavior                                                       |
| ----------- | ---------------------------------- | -------------------------------------------------------------- |
| Permissions | `.claude/settings.json`            | Defines allow/ask/deny command lists                           |
| Rules       | `.claude/rules/`                   | Auto-loaded by glob pattern in frontmatter (e.g., `**/*`)      |
| Hooks       | `.claude/hooks/format.sh`          | PostToolUse: auto-runs prettier on all changed files (vs HEAD) |
| Sub-agent   | `.claude/agents/river-reviewer.md` | Code review delegation; uses Read, Grep, Glob, Bash            |

## Custom Commands

| Command             | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `/check`            | Run quality checks (lint + test)                          |
| `/pr`               | Draft PR description                                      |
| `/skill`            | Find or create skill definition                           |
| `/review-local`     | Self-review current diff                                  |
| `/challenge`        | Adversarial review (pre-mortem, war game)                 |
| `/propose-issue`    | Research codebase before creating an issue                |
| `/plan-merge-order` | Plan merge order for multiple PRs to minimize rebase cost |

Details: `.claude/commands/`
