# .claude/commands/

Custom slash commands for Claude Code.

| Command             | File                  | Purpose                                                   |
| ------------------- | --------------------- | --------------------------------------------------------- |
| `/check`            | `check.md`            | Run quality checks (lint + test)                          |
| `/pr`               | `pr.md`               | Draft PR description                                      |
| `/skill`            | `skill.md`            | Find or create skill definition                           |
| `/review-local`     | `review-local.md`     | Self-review current diff                                  |
| `/challenge`        | `challenge.md`        | Adversarial review (pre-mortem, war game)                 |
| `/propose-issue`    | `propose-issue.md`    | Research codebase before creating an issue                |
| `/plan-merge-order` | `plan-merge-order.md` | Plan merge order for multiple PRs to minimize rebase cost |
| `/preflight`        | `preflight.md`        | Verify tasks are not obsolete or in parallel before work  |

> **整合性**: CLAUDE.md `Custom Commands` 表と本表は同期必須。コマンド追加時は両方を更新すること。
