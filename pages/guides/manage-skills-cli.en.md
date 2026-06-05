---
title: Import / export / list skills (CLI)
---

River Review can convert between Agent Skills (`SKILL.md` packages) and River Review-format skills, and list them. The `river skills import|export|list` subcommands let you bring in external Agent Skills, write your own skills out in Agent Skills format, and inspect which skills are currently recognized.

> For the skill definition format itself, see the [Manifest-driven Skills guide](./agent-skills-codex-cli.md); for validation, see [Validate the skill schema](./validate-skill-schema.md). This page focuses only on the import / export / list CLI.

## 1. Inspect the skill list (`skills list`)

Lists the skills River Review currently recognizes.

```bash
river skills list
```

It prints a table of `ID` / `NAME` / `SOURCE` / `PATH`. `SOURCE` is one of:

- `rr` — River Review-format skill (under `skills/`)
- `agent` — Agent Skills-format package (a `SKILL.md` under `.agents/skills` / `.github/skills` / `.claude/skills`)

An Agent Skill that has already been loaded as a River Review-format skill (i.e. imported) is de-duplicated and shown only as `rr`.

### Filter by source (`--source`)

```bash
river skills list --source rr      # River Review format only
river skills list --source agent   # Agent Skills format only
river skills list --source all     # both (default)
```

## 2. Import Agent Skills (`skills import`)

Converts external `SKILL.md` packages into River Review format and imports them.

```bash
river skills import
```

When `--from` is not given, the following directories are scanned by default:

- `.agents/skills`
- `.github/skills`
- `.claude/skills`

Converted skills are written to `skills/agent-skills/` by default.

### Specify source and destination (`--from` / `--to`)

```bash
river skills import --from ./vendor/skills --to ./skills/imported
```

- `--from <path>` — source directory to scan for `SKILL.md`
- `--to <path>` — output directory for the converted skills

### Validation mode (`--strict` / `--loose`)

- `--strict` (default) — requires full River Review schema compliance. Missing required fields are reported as failures.
- `--loose` — requires only minimal fields such as `name` / `description` and auto-fills the rest. Use this to quickly bring in an external skill you want to try locally.

### Validate without writing (`--dry-run`)

```bash
river skills import --from ./vendor/skills --dry-run
```

Performs conversion and validation only, without writing files. Use it as a pre-import check.

On completion, the counts of "imported / failed / warnings" are printed. If `failed` is one or more, the exit code is `1`.

## 3. Export skills to Agent Skills format (`skills export`)

Converts River Review-format skills (under `skills/`) into the Agent Skills `SKILL.md` format.

```bash
river skills export
```

The default destination is `.agents/skills`. Change it with `--to`.

```bash
river skills export --to ./dist/agent-skills
```

### Include accompanying assets (`--include-assets`)

```bash
river skills export --include-assets
```

Copies the `references/` / `scripts/` / `prompt/` directories alongside `SKILL.md`. Use it when you want to distribute reference files and scripts together with the skill body.

On completion, the counts of "exported / failed" are printed. If `failed` is one or more, the exit code is `1`.

## Options at a glance

| Subcommand | Option             | Description                                                             |
| ---------- | ------------------ | ----------------------------------------------------------------------- |
| `import`   | `--from <path>`    | Source directory to scan for `SKILL.md` (default: standard search dirs) |
| `import`   | `--to <path>`      | Output directory for converted skills (default: `skills/agent-skills/`) |
| `import`   | `--strict`         | Require full River Review schema compliance (default)                   |
| `import`   | `--loose`          | Require only minimal fields and auto-fill the rest                      |
| `import`   | `--dry-run`        | Validate only, without writing files                                    |
| `export`   | `--to <path>`      | Output directory for `SKILL.md` (default: `.agents/skills`)             |
| `export`   | `--include-assets` | Also copy `references/` `scripts/` `prompt/`                            |
| `list`     | `--source <type>`  | Filter: `rr` / `agent` / `all` (default: `all`)                         |

## Related pages

- [Manifest-driven Skills guide](./agent-skills-codex-cli.md) — skill definition format (Markdown / YAML)
- [Add a new skill (quickest path)](./add-new-skill.md)
- [Validate the skill schema](./validate-skill-schema.md)
