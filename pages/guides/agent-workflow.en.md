# Using River Review from AI Agents

> **Which entry point should I use?**
> Use `river run .` from any shell (including non-Claude environments); use `/review-local` when you want River Review orchestrated by Claude Code with automatic context passing from the current session; use the sub-agent (`.claude/agents/river-review.md`) for delegated, headless review tasks within a Claude Code session where you want the review to run as a background step.

## Overview

River Review is a CLI-based tool, so it works with any AI agent — Claude Code, Cursor, Codex CLI, GitHub Copilot, and others. Regardless of which agent you use, all it takes is a call to `river run .`.

---

## Common Commands (Agent-Independent)

The following commands work the same way regardless of which agent you use.

```bash
# Review the local diff
river run .

# Auto team selection (roles chosen automatically based on diff content)
river run . --reviewers auto

# Dry-run (no API key required)
river run . --dry-run

# Output in JSON format
river run . --output json
```

### How `--reviewers auto` works

When `auto` is specified, River Review analyzes the diff content and selects reviewer roles automatically. `bug-hunter` is always included; additional roles are added based on the following signals:

| Signal                                                                           | Role added         |
| -------------------------------------------------------------------------------- | ------------------ |
| config / schema / migration / infra files changed, or risk-escalated files exist | `security-scanner` |
| test files changed, or 3 or more app files changed                               | `test-gap`         |

To see which roles were selected, check the `autoSelectedRoles` field in the JSON output:

```json
{
  "autoSelectedRoles": ["bug-hunter", "security-scanner", "test-gap"]
}
```

---

## How to Invoke by Agent

| Agent          | How to Invoke                           | Dedicated Definition File                  |
| -------------- | --------------------------------------- | ------------------------------------------ |
| Claude Code    | Bash tool / `/review-local` / sub-agent | `.claude/agents/river-review.md`           |
| Cursor         | Terminal tab / `@terminal`              | —                                          |
| Codex CLI      | `codex exec "river run ."`              | `templates/agent-workflow/codex/AGENTS.md` |
| GitHub Copilot | Run directly in terminal                | `.github/agents/river-review.agent.md`     |
| Others         | `river run .` in any shell              | `agents/examples/river-review.agent.yaml`  |

### Claude Code

Run via the Bash tool:

```bash
river run . --reviewers auto
```

Slash commands and the sub-agent are also available:

```text
/review-local
```

```text
Please ask river-review to review the current diff
```

Dedicated definition: `.claude/agents/river-review.md`

### Cursor

Call it as a terminal command from Cursor's Agent mode:

```bash
river run . --reviewers auto
```

See `templates/agent-workflow/` for ready-to-use config templates.

### Codex CLI

```bash
codex exec "river run . --reviewers auto"
```

Codex supports the same plugin marketplace as Claude Code (both share the same `.claude-plugin/marketplace.json`). The recommended installation method is to add the marketplace:

```bash
codex plugin marketplace add s977043/river-review
```

Codex reads its skills and interface metadata from the repo's `.codex-plugin/plugin.json` (the Codex-native manifest), so adding the marketplace natively registers the specialist review skills with no extra setup.

As a fallback when the marketplace is not used, run `scripts/setup-codex.sh` (it vendors the `AGENTS.md` guidance and the full `skills/agent-skills/` tree, including references/, idempotently) or take the dedicated definition `templates/agent-workflow/codex/AGENTS.md` and merge or append its contents into your project's `AGENTS.md`. This enables River Review to run automatically before commits.

### GitHub Copilot

`.github/agents/river-review.agent.md` is already defined. Run `river run .` in the terminal, or instruct Copilot to "run `river run .` and report the review results."

### Other Agents

Any environment that can execute shell commands can call `river run .` directly.

---

## Agent Skills (Cross-Agent Skill Definitions)

`skills/agent-skills/` contains **agent-independent skill definitions** that can be passed to any agent.

| Skill                       | Purpose                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `river-review`              | Main review (intent classification → routing to specialist skills) |
| `river-review-code`         | Code quality review                                                |
| `river-review-security`     | Security-focused review                                            |
| `river-review-performance`  | Performance review (N+1 / optimization)                            |
| `river-review-testing`      | Test coverage review                                               |
| `river-review-architecture` | Architecture review                                                |
| `adversarial-review`        | Adversarial review (challenge assumptions)                         |

To use a skill with an agent, load `skills/agent-skills/<skill-name>/SKILL.md` into the agent's context.

---

## W-Check (Combining Multiple AI Results)

To combine review results from multiple agents, use the W-Check feature. See the [W-Check Practical Guide](./w-check.md) for details.

---

## Related Pages

- [Quickstart](./quickstart.md)
- [GitHub Actions Setup](./github-actions.md)
- [W-Check Practical Guide](./w-check.md)
