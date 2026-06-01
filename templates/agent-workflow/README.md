# Agent Workflow Templates

Ready-to-use config files for integrating River Reviewer into AI agent workflows.

## Templates

| Directory | File           | Purpose                                               |
| --------- | -------------- | ----------------------------------------------------- |
| `cursor/` | `.cursorrules` | Tells Cursor when and how to invoke River Reviewer    |
| `codex/`  | `AGENTS.md`    | Tells Codex CLI when and how to invoke River Reviewer |

## Usage

Copy the relevant file into your project root:

```bash
# Cursor
cp templates/agent-workflow/cursor/.cursorrules /your-project/.cursorrules

# Codex CLI
cp templates/agent-workflow/codex/AGENTS.md /your-project/AGENTS.md
```

If your project already has a `.cursorrules` or `AGENTS.md`, append the River Reviewer section to it.

## Further reading

See [pages/guides/agent-workflow.md](../../pages/guides/agent-workflow.md) for the full agent integration guide.
