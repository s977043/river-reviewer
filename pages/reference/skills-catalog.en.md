# Skills Catalog

The complete, always-current catalog of bundled skills is **auto-generated** from
the skill metadata (`scripts/generate-skill-catalog.mjs`) and is maintained only in
Japanese, organized by phase:

- **[Skills Catalog (Japanese)](./skills-catalog.md)** — the full list of every
  bundled skill (upstream / midstream / downstream) with target globs, severity,
  tags, dependencies, and conditions.

> Skill `name`, target globs, tags, severity, and conditions are
> language-neutral, so the Japanese catalog is usable as a reference even without
> reading Japanese. Per-skill summaries follow each skill's source `description`
> (currently Japanese). An English-generated catalog will follow once skills carry
> English `description` fields.

To browse skills directly, see [`skills/`](https://github.com/s977043/river-review/tree/main/skills)
in the repository. For how skills are selected and routed, see the
[agent workflow guide](../guides/agent-workflow.en.md).
