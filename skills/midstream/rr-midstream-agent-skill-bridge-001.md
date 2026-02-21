---
id: rr-midstream-agent-skill-bridge-001
name: Agent Skill Bridge Review
description: Review changes to the Agent Skills import/export bridge for path safety, round-trip fidelity, and validation correctness.
version: 0.1.0
phase: midstream
applyTo:
  - 'src/lib/agent-skill-bridge.mjs'
  - 'tests/agent-skill-bridge.test.mjs'
  - 'schemas/agent-skill-loose.schema.json'
  - 'scripts/validate-agent-skills.mjs'
tags:
  - bridge
  - skills
  - midstream
severity: major
inputContext:
  - diff
outputKind:
  - findings
  - actions
modelHint: balanced
---

## Guidance

- **Path traversal**: `assertSafePath` must reject ids containing `..`, `/`, or NUL bytes. Any new file-write path must route through this function or `sanitizeSkillId`.
- **Round-trip fidelity**: export followed by re-import must preserve `name`, `description`, and body content. Verify that new fields added to conversion logic do not break this property.
- **Auto-fill correctness**: `convertAgentSkillToRR` must not overwrite explicitly provided values (id, category, phase, applyTo). Defaults apply only when the field is absent.
- **Validation gate**: both strict and loose validation paths must be exercised. The `errors` array must capture invalid skills without aborting the entire import batch.
- **Test coverage**: every newly exported function from the module must have at least one `node:test` case.

## Non-goals

- Do not critique the RR skill schema itself; focus on bridge logic only.
- Do not flag auto-fill behaviour as missing validation when the converted metadata passes the strict RR schema.

## False-positive guards

- If the diff only touches comments, JSDoc, or whitespace in bridge files, skip review.
- If test fixtures are added without corresponding logic changes, that is expected (test-only commits).
