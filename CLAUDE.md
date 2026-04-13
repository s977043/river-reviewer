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
- **Commit before branch switches**: Before `git checkout`/`git switch` with uncommitted work, create a throwaway safety commit on a new branch: `git switch -c wip/<topic> && git add -A && git commit -m "wip" --no-verify`. Stash-then-switch chains have lost work when combined with the lint-staged auto-stash. Does not authorize `git stash drop`, `git reset --hard`, or `git push --force` — those remain prohibited per AGENTS.md Safety.
- **Verify git output before chaining**: Extends **Run before claiming**. After `git commit`, `git push`, `git switch`, and `gh pr merge`, read the branch name, commit hash, and status line in the output and confirm they match the intended target before running the next command. Verify with `git status -sb` or `git rev-parse --abbrev-ref HEAD` if the output is ambiguous.
- **Verify CI green before merge**: Before `gh pr merge`, run `gh pr checks` and confirm all required checks are in the `pass` bucket (no `fail`, `pending`, or `cancel`). Filter with `gh pr checks --json name,bucket --jq '.[] | select(.bucket != "skipping")'` to exclude `SKIPPED` items. Do not merge PRs with failing required checks (e.g. "Lint", "Unit tests"), including pre-existing failures. If a failure is pre-existing, open a fix PR targeting `main` first, then rebase the original PR and merge. See also `docs/governance.md` § "PR レビューとマージ".
- **Verify reviewer comments before merge**: Extends **Verify CI green before merge**. CI green does not cover line-level comments from AI reviewers (`Copilot`, `sentry[bot]`) and humans — they do not fail CI but can hide real bugs. Enumerate them with `gh api --paginate 'repos/:owner/:repo/pulls/<N>/comments?per_page=100' --jq '.[] | {id, in_reply_to_id, user: .user.login, path, line, start_line, original_line, commit: .commit_id, body}'` (`--paginate` is required — the default first page caps at 30 comments; put `per_page` in the URL query string, not as `-F per_page=100`, because `-F` flips `gh api` to POST and returns HTTP 422). For multi-line ranges, `line` is the end line and `start_line` is the start line; `line: null` means the comment is outdated because the anchored line disappeared after a later commit (cross-reference `commit` against `gh pr view <N> --json headRefOid`). Use `in_reply_to_id` to reconstruct comment threads. Bug predictions from bots live in `pulls/<N>/comments` — `gh pr view <N> --json reviews,reviewDecision` surfaces only review summaries (often with empty `body` for bots) and `reviewDecision` can be empty with real findings present, so do not rely on review state alone. Dispose of each comment as: (a) addressed in a follow-up commit, (b) the bot itself posted a follow-up marking the finding resolved (e.g. sentry `*Resolved in <sha>`; Copilot does not self-resolve), or (c) a reply on the same comment thread (`gh api .../pulls/comments/<comment_id>/replies` or web UI) stating the reason. See also `skills/midstream/rr-midstream-gh-address-comments-001/SKILL.md`.
- **Preflight before multi-PR work**: Before starting any write-side operation on a handoff PR task (multi-PR merge, main CI failure fix, new fix PR), run `/preflight <keyword or PR numbers>` to verify the task is not already merged, closed as obsolete, or being handled in parallel. `gh pr list` caches state via GraphQL and can return stale `open` for recently merged PRs — always cross-check with `gh api repos/.../pulls/{N}` (REST). Skipping this led to 4 duplicate PRs in a single session (#485, #489, #492, #496).

## Improvement Flow

When a retrospective identifies a recurring mistake or missing guardrail, follow the codification process in `docs/development/improvement-flow.md`: retrospect → classify → draft → self-review → multi-agent review → PR → save memory. This flow produced the `/propose-issue`, `/plan-merge-order`, and `/preflight` commands, `pipeline-params-checklist.md`, and the AI Misoperation Guards "Research before proposing", "Propagate signatures", "Plan merge order", "Commit before branch switches", "Verify git output before chaining", "Verify CI green before merge", "Verify reviewer comments before merge", and "Preflight before multi-PR work".

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
