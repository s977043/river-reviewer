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

1. If the PostToolUse stdin JSON provides `.tool_input.file_path` (the single
   file just edited) and `jq` is available, formats only that file.
2. Otherwise falls back to detecting changed files via `git diff`.
3. Filters for supported extensions (js, jsx, ts, tsx, json, md, yml, yaml, mjs)
4. Runs `prettier --write` on the selected file(s)

### Hook input contract

> **PostToolUse passes its input as a stdin JSON payload, not as environment
> variables.** The edited file path is `.tool_input.file_path` in that JSON.
> If you fork or reimplement this hook, read it from stdin (e.g.
> `jq -r '.tool_input.file_path'`) — assuming an env var such as
> `CLAUDE_TOOL_INPUT_FILE_PATH` silently turns the hook into a no-op.

The stdin path is read only when stdin is not a TTY, so running the script
manually in a terminal still works (it skips straight to the `git diff` path).

### Customization

Edit the grep pattern to include/exclude file types as needed.
