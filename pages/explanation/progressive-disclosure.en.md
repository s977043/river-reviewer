# Progressive Disclosure

## Overview

Progressive Disclosure is a strategy for loading skill context at increasing levels of detail only when needed.

In LLM-based review, loading all skills in full up front causes:

- **Token waste**: unselected skill bodies consume Context Budget
- **Attention dilution**: important skill instructions get buried in irrelevant text
- **Routing ambiguity**: the loader holds full details of every skill, increasing selection noise

## Three-Stage Model

River Reviewer loads skill context in three stages:

### Stage 1: Metadata (always loaded)

Used for skill listing and filtering. Frontmatter is extracted from every skill file at startup.

**Fields included:**

- `id`, `name`, `description`
- `phase`, `applyTo` (routing decisions)
- `tags`, `severity`
- `inputContext`, `outputKind`
- `modelHint`, `dependencies`, `priority`

**Purpose:** phase filter, file pattern matching, context requirement checks, dependency checks

### Stage 2: Instructions (loaded after selection)

Loaded after the Planner/Router selects a skill. Contains the Markdown body (text after frontmatter).

**Fields included:**

- `body` (Markdown body / review instructions)

**Purpose:** injecting skill instructions into the LLM prompt

### Stage 3: Reference Context (loaded at execution time)

Loaded as needed when the Runner executes a review.

**Fields included:**

- `prompt.system`, `prompt.user` (custom prompts)
- `fixtures/`, `golden/` (test data)
- Riverbed Memory entries (past decisions)
- Project rules (`.river/rules.md`)

**Purpose:** improving review accuracy, supplementing context

## Why Three Stages?

```text
All skills (111+)
  │
  ├── Stage 1: Metadata → Filter → 10-15 skill candidates
  │
  ├── Stage 2: Body load → only 3-5 selected skills
  │
  └── Stage 3: References → only execution-time supplements
```

Each stage narrows the information, so the final context passed to the LLM is "minimal and high-signal." This balances efficient Context Budget usage with focused Attention Budget allocation.

## Current Implementation Status

| Item                                       | Status                      |
| ------------------------------------------ | --------------------------- |
| `loadSkills()` — full load of all skills   | ✅ Existing                 |
| `summarizeSkill()` — metadata-only summary | ✅ Existing (Stage 1 proto) |
| `loadSkillMetadata()` — metadata-only load | 🔜 Planned                  |
| Explicit Stage 2/3 separation              | 📋 Designed                 |

## Related

- [Glossary: Progressive Disclosure](../reference/glossary.en.md)
- [Skill Schema Reference](../reference/skill-schema-reference.en.md)
- [Architecture](./river-architecture.en.md)
