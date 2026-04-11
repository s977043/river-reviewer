# .claude/rules/

Auto-applied rules for Claude Code sessions. Each rule file has a `globs` field in its frontmatter that determines when it is loaded.

| Rule        | Glob   | Purpose                                         |
| ----------- | ------ | ----------------------------------------------- |
| review-core | `**/*` | Review severity mapping and prohibited patterns |

References:

- `docs/review/output-format.md` (severity labels and output structure)
- `docs/review/viewpoints.md` (review observation checklist)
- `pages/reference/review-policy.md` (full review policy)
