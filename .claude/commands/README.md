# .claude/commands/ (repo-dev commands)

Repo-development slash commands (NOT part of the distributed plugin surface).

| Command             | File                  | Purpose                                                   |
| ------------------- | --------------------- | --------------------------------------------------------- |
| `/propose-issue`    | `propose-issue.md`    | Research codebase before creating an issue                |
| `/plan-merge-order` | `plan-merge-order.md` | Plan merge order for multiple PRs to minimize rebase cost |
| `/preflight`        | `preflight.md`        | Verify tasks are not obsolete or in parallel before work  |

> **配布対象のコマンド** (`/check` `/pr` `/skill` `/review-local` `/challenge`) は #996 で top-level [`commands/`](../../commands/) へ分離し、`.claude-plugin/plugin.json` がそこを参照します。本ディレクトリには repo-dev 専用コマンドのみが残ります。
>
> **整合性**: CLAUDE.md `Custom Commands` 表とこれら2箇所（`commands/` と `.claude/commands/`）は同期必須。コマンド追加時は配布対象か repo-dev かを判断して正しい場所に置くこと。
