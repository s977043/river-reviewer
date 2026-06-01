# Using River Reviewer from AI Agents

## Overview

River Reviewer is a CLI-based tool, so it works with any AI agent — Claude Code, Cursor, Codex CLI, GitHub Copilot, and others. Regardless of which agent you use, all it takes is a call to `river run .`.

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

When `auto` is specified, River Reviewer analyzes the diff content and selects reviewer roles automatically. `bug-hunter` is always included; additional roles are added based on the following signals:

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

| Agent          | How to Invoke                           | Dedicated Definition File                   |
| -------------- | --------------------------------------- | ------------------------------------------- |
| Claude Code    | Bash tool / `/review-local` / sub-agent | `.claude/agents/river-reviewer.md`          |
| Cursor         | Terminal tab / `@terminal`              | —                                           |
| Codex CLI      | `codex exec "river run ."`              | —                                           |
| GitHub Copilot | Run directly in terminal                | `.github/agents/river-reviewer.agent.md`    |
| Others         | `river run .` in any shell              | `agents/examples/river-reviewer.agent.yaml` |

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
Please ask river-reviewer to review the current diff
```

Dedicated definition: `.claude/agents/river-reviewer.md`

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

See `templates/agent-workflow/` for ready-to-use config templates.

### GitHub Copilot

`.github/agents/river-reviewer.agent.md` is already defined. Run `river run .` in the terminal, or instruct Copilot to "run `river run .` and report the review results."

### Other Agents

Any environment that can execute shell commands can call `river run .` directly.

---

## Agent Skills (Cross-Agent Skill Definitions)

`skills/agent-skills/` contains **agent-independent skill definitions** that can be passed to any agent.

| Skill                         | Purpose                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| `river-reviewer`              | Main review (intent classification → routing to specialist skills) |
| `river-reviewer-code`         | Code quality review                                                |
| `river-reviewer-security`     | Security-focused review                                            |
| `river-reviewer-testing`      | Test coverage review                                               |
| `river-reviewer-architecture` | Architecture review                                                |
| `adversarial-review`          | Adversarial review (challenge assumptions)                         |

To use a skill with an agent, load `skills/agent-skills/<skill-name>/SKILL.md` into the agent's context.

---

## W-Check (Combining Multiple AI Results)

To combine review results from multiple agents, use the W-Check feature. See the [W-Check Practical Guide](./w-check.md) for details.

---

## Related Pages

- [Quickstart](./quickstart.md)
- [GitHub Actions Setup](./github-actions.md)
- [W-Check Practical Guide](./w-check.md)
