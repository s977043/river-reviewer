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

Codex supports the same plugin marketplace as Claude Code — both read the same
`.claude-plugin/marketplace.json`. The primary method is to add the marketplace:

```bash
codex plugin marketplace add s977043/river-review
```

Pin a tag for reproducibility: `codex plugin marketplace add s977043/river-review@v1.2.2`.

Codex reads its skills and interface metadata from the repo's `.codex-plugin/plugin.json`
(the Codex-native manifest), so adding the marketplace natively registers the
specialist review skills with no extra setup.

#### Alternative: manual vendoring (fallback)

For environments without the marketplace, vendor the river-review skills as plain
skill docs that Codex reads. Copy the skills directory into your project (or point
Codex at a checkout of this repo via `CODEX_HOME`):

```bash
cp -R skills/agent-skills /your-project/skills
```

Then reference the skills from your `AGENTS.md`. Add your own `.codex/config.toml`
(`approval_policy`, `sandbox`) to taste — the repo's `.codex/` config is
environment-specific and is intentionally not shipped as a template.

With manual vendoring, the Codex integration is versioned by git only; there is no
auto-update. Re-copy `AGENTS.md` and `skills/agent-skills/` when you upgrade.

## Further reading

See [pages/guides/agent-workflow.md](../../pages/guides/agent-workflow.md) for the full agent integration guide.

### One-command setup (Codex) — vendoring fallback

If you are not using the marketplace, run the setup script from your project root
instead of copying files by hand. It vendors the River Review `AGENTS.md` guidance
and agent-skills into your project:

```bash
curl -fsSL https://raw.githubusercontent.com/s977043/river-review/main/scripts/setup-codex.sh | bash
```

The script is idempotent: re-running it refreshes the vendored skills and the
`AGENTS.md` River Review section (delimited by `<!-- river-review:begin -->` /
`<!-- river-review:end -->`) without duplicating content. Pin a tag for
reproducibility by exporting `RIVER_REVIEW_REF=v1.2.2` before running.
