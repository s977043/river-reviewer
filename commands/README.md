# commands/ (distributed plugin commands)

Slash commands shipped as part of the River Review plugin (referenced by `.claude-plugin/plugin.json`). Separated from repo-development commands (which stay in [`.claude/commands/`](../.claude/commands/)) per #996.

| Command         | File              | Purpose                                   |
| --------------- | ----------------- | ----------------------------------------- |
| `/check`        | `check.md`        | Run quality checks (lint + test)          |
| `/pr`           | `pr.md`           | Draft PR description                      |
| `/skill`        | `skill.md`        | Find or create skill definition           |
| `/review-local` | `review-local.md` | Self-review current diff                  |
| `/challenge`    | `challenge.md`    | Adversarial review (pre-mortem, war game) |

> **整合性**: 配布対象コマンドの追加・変更時は `.claude-plugin/plugin.json` の `commands` と CLAUDE.md `Custom Commands` 表も更新すること。
