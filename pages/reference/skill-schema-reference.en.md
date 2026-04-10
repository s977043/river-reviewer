# Skill Schema Reference

All skills in River Reviewer must conform to JSON schema located at:

```text
/schemas/skill.schema.json
```

## Required fields

| Field       | Description                                          |
| ----------- | ---------------------------------------------------- |
| id          | Unique skill identifier (rr-xxxx format recommended) |
| name        | Human-readable skill name                            |
| description | What the skill checks                                |
| phase       | upstream / midstream / downstream                    |
| applyTo     | File glob patterns                                   |

`phase` and `applyTo` can be specified at the top level or within a `trigger` object (`trigger.phase`, `trigger.applyTo` / `trigger.files`). If both are specified, the top-level properties take precedence.

## Example

```yaml
---
id: rr-python-sqlinj-v1-en
name: Python SQL Injection Check
description: Detects SQL injection patterns in Python code
phase: midstream
applyTo:
  - '**/*.py'
tags: ['security', 'owasp']
---
# instructions...
```

### Example with trigger wrapper

```yaml
---
id: rr-python-sqlinj-v2-en
name: Python SQL Injection Check
description: Detects SQL injection patterns in Python code
trigger:
  phase: midstream
  files:
    - '**/*.py'
tags: ['security', 'owasp']
---
# instructions...
```

## Loading Stages

Skill fields correspond to three stages of [Progressive Disclosure](../explanation/progressive-disclosure.en.md).

| Stage           | Timing                | Fields                                                                                                                                     |
| --------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1: Metadata     | Always (at startup)   | `id`, `name`, `description`, `phase`, `applyTo`, `tags`, `severity`, `inputContext`, `outputKind`, `modelHint`, `dependencies`, `priority` |
| 2: Instructions | After skill selection | `body` (Markdown body)                                                                                                                     |
| 3: References   | At review execution   | `prompt.system`, `prompt.user`, `fixtures/`, `golden/`, Riverbed Memory entries                                                            |

Stage 1 fields are used for filtering and routing. Stage 2 and beyond are used for LLM prompt construction. The loader is designed to complete skill selection using only Stage 1 metadata.
