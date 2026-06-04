---
description: Load the best-matching skill doc from skills/ and apply it to the current task
argument-hint: '[keyword]'
allowed-tools: Bash(rg:*)
---

Find the best matching review skill for: $ARGUMENTS

The bundled skills live in `${CLAUDE_PLUGIN_ROOT}/skills/agent-skills/` when this is
installed as a plugin, or in `./skills/agent-skills/` when working inside the
river-review repo itself.

Steps:

1. Set `SKILL_ROOT="${CLAUDE_PLUGIN_ROOT:-.}/skills/agent-skills"` and search it for the
   keyword (case-insensitive), e.g. `rg -i "$ARGUMENTS" "$SKILL_ROOT"`.
2. Identify the most relevant `SKILL.md` (note: filenames are uppercase `SKILL.md`).
3. Summarize the workflow rules from that skill.
4. Apply those rules to the current task and proceed.
