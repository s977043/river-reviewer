# Agent Workflow Templates

Ready-to-use config files for integrating River Review into AI agent workflows.

## Templates

| Directory | File           | Purpose                                             |
| --------- | -------------- | --------------------------------------------------- |
| `cursor/` | `.cursorrules` | Tells Cursor when and how to invoke River Review    |
| `codex/`  | `AGENTS.md`    | Tells Codex CLI when and how to invoke River Review |

## Usage

Copy the relevant file into your project root:

```bash
# Cursor
cp templates/agent-workflow/cursor/.cursorrules /your-project/.cursorrules

# Codex CLI
cp templates/agent-workflow/codex/AGENTS.md /your-project/AGENTS.md
```

If your project already has a `.cursorrules` or `AGENTS.md`, append the River Review section to it.

### Making the review skills available to Codex

Codex has no plugin marketplace, so the river-review skills are vendored as plain
skill docs that Codex reads. Copy the skills directory into your project (or point
Codex at a checkout of this repo via `CODEX_HOME`):

```bash
cp -R skills/agent-skills /your-project/skills
```

Then reference the skills from your `AGENTS.md`. Add your own `.codex/config.toml`
(`approval_policy`, `sandbox`) to taste — the repo's `.codex/` config is
environment-specific and is intentionally not shipped as a template.

The Codex integration is versioned by git only; there is no auto-update. Re-copy
`AGENTS.md` and `skills/agent-skills/` when you upgrade.

## Further reading

See [pages/guides/agent-workflow.md](../../pages/guides/agent-workflow.md) for the full agent integration guide.
