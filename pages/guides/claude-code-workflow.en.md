# Using River Reviewer from Claude Code

## Overview

There are three ways to request reviews from River Reviewer within Claude Code. Each has different use cases and execution costs, so choose the one that fits your needs.

## Method 1: `/review-local` Command (Fastest)

Use it as a Claude Code slash command. Claude reviews the current working-tree diff directly.

```text
/review-local
```

**Characteristics:**

- Runs instantly without calling an external LLM
- Uses only `git diff`, `git status`, and `git log`
- Reviews based on River Reviewer skill rules

**Best for:** A quick check before committing changes.

---

## Method 2: Delegate to the `river-reviewer` Sub-agent

The Claude Code Agent tool loads the definition in `.claude/agents/river-reviewer.md` and runs a dedicated sub-agent to perform the review.

Type the following in the Claude Code prompt:

```text
Please ask river-reviewer to review the current diff
```

Or the short form:

```text
@river-reviewer review the changes on this branch
```

**Characteristics:**

- The sub-agent reads `git diff` and consults the `skills/` directory
- Reviews for correctness, security, performance, and maintainability
- Uses only Read / Grep / Glob / Bash (read-only)

**Best for:** A thorough review right after writing code, before opening a PR.

---

## Method 3: Run the CLI via the Bash Tool (Full Review)

Run `river run .` through Claude Code's Bash tool. An external LLM performs the actual review, providing more detailed findings.

**Prerequisites:** `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` must be set as an environment variable.

```bash
# Basic (review in midstream phase)
river run .

# Auto team selection (roles chosen automatically based on diff and risk signals)
river run . --reviewers auto

# Dry-run (no API key required, skill heuristics only)
river run . --dry-run

# Output in JSON format
river run . --output json
```

To invoke from the Claude Code prompt:

```text
Run river run . --reviewers auto and tell me the review results
```

**Characteristics:**

- Performs a full review using an external LLM
- `--reviewers auto` automatically selects reviewer roles based on diff content
- `--dry-run` shows skill matching results without an API key
- `--save` persists the review run to `.river/runs/`

**Best for:** When you need a thorough code review or are dealing with large changes.

---

## Choosing a Method

| Method          | LLM Used           | Execution Time | Best For                     |
| --------------- | ------------------ | -------------- | ---------------------------- |
| `/review-local` | Claude Code itself | Instant        | Quick check before commit    |
| Sub-agent       | Claude Code itself | A few seconds  | Review before opening a PR   |
| `river run .`   | External LLM       | 30s+           | Full review / CI integration |

---

## W-Check (Combining Multiple AI Results)

To combine review results from other AIs (e.g., Codex), place each AI's review result `.md` file in `.river/reviews/` and run:

```bash
river run . --ensemble .river/reviews/
```

See the [W-Check Practical Guide](./w-check.md) for details.

---

## Related Pages

- [Quickstart](./quickstart.md)
- [GitHub Actions Setup](./github-actions.md)
- [W-Check Practical Guide](./w-check.md)
