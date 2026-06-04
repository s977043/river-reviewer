# AGENTS.md — River Review integration

## Code review (primary: skill-driven, no CLI required)

Before finalizing any code change, review the diff using the bundled review skills
under `skills/agent-skills/` — they are self-contained and need no external tooling.
Load `skills/agent-skills/river-review/SKILL.md` (the orchestrator) and route to the
relevant specialist skills (`river-review-code`, `-security`, `-performance`,
`-architecture`, `-testing`, `adversarial-review`) based on the diff content.

### Optional accelerator — the `river` CLI

If the `river` CLI is available on `PATH`, you may use it to bootstrap structured
findings. It is **optional**, not required:

```bash
river run . --reviewers auto
```

If neither `ANTHROPIC_API_KEY` nor `OPENAI_API_KEY` is set, use dry-run mode:

```bash
river run . --dry-run
```

The CLI is distributed separately from this skill set; if it is not installed, rely on
the skills above.

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
