# Claude Hooks

## format.sh

Post-edit hook that runs after Claude writes or edits files.

### Purpose

- Auto-format changed files to reduce diff noise
- Keep formatting consistent without manual intervention

### Setup

```bash
chmod +x .claude/hooks/format.sh
```

### How it works

1. Detects changed files via `git diff`
2. Filters for supported extensions (js, jsx, ts, tsx, json, md, yml, yaml, mjs)
3. Runs `prettier --write` on those files

### Customization

Edit the grep pattern to include/exclude file types as needed.
