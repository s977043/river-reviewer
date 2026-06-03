# AGENTS.md — River Review integration

## Prerequisite: the `river` CLI

The commands below invoke the `river` CLI. Make sure it is available on `PATH`
first — install it (`npm install -g river-review`) or run it via `npx river ...`.
If the CLI is not installed, use the agent-skills under `skills/agent-skills/`
directly instead of the CLI commands.

## Code review

Before finalizing any code change, run River Review to catch issues:

```bash
river run . --reviewers auto
```

If neither the `ANTHROPIC_API_KEY` nor the `OPENAI_API_KEY` environment variable is set, use dry-run mode:

```bash
river run . --dry-run
```

## When to invoke

- After implementing a feature or fix, before committing.
- When the user explicitly requests a review.
- Before opening or updating a pull request.

## Interpreting results

| Severity | Action                                     |
| -------- | ------------------------------------------ |
| Critical | Must fix before merging. Report to user.   |
| Major    | Should fix before merging. Report to user. |
| Minor    | Advisory. Surface to user; does not block. |
| Info     | Informational only.                        |

Output in JSON for programmatic use:

```bash
river run . --reviewers auto --output json
```
