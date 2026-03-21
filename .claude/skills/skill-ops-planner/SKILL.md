---
name: skill-ops-planner
description: Create an operating policy and roadmap for a live portfolio of Claude Code skills. Use when the user asks to organize, govern, audit, measure, retire, or scale skills already used by a team or repository. Also trigger on "スキルの運用計画", "スキルポートフォリオ", "スキルロードマップ", "スキルを整理して".
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash
---

## Purpose

Plan how a team should operate a set of skills over time.

Your job is to define:

- portfolio structure
- ownership
- lifecycle stages
- evaluation policy
- rollout policy
- retirement policy
- review cadence

## Phase 0: Portfolio gate

Before planning, identify:

- active skills
- target users or teams
- current pain points
- risk level by skill category
- current review process
- current storage layout
- current evaluation maturity

If the current inventory is missing:

- create an inventory-first plan
- do not pretend portfolio governance already exists

## Phase 1: Inventory and segmentation

Group skills by type:

- knowledge
- workflow automation
- investigation / read-only
- review / verification
- side-effecting operational tasks

For each group, define:

- owner
- auto vs manual invocation policy
- tool restriction level
- validation requirement
- retirement signals

## Phase 2: Lifecycle policy

Define lifecycle stages:

1. proposed
2. experimental
3. team-approved
4. production
5. deprecated
6. retired

For each stage, define:

- entry criteria
- required eval coverage
- review requirement
- allowed blast radius
- logging requirement

## Phase 3: Metrics and governance

Define portfolio metrics:

- trigger precision
- task success rate
- review pass rate
- rollback rate
- mean tool count
- failure recurrence
- stale skill count

Also define:

- monthly review cadence
- change approval policy
- emergency disable policy
- documentation freshness policy

## Phase 4: Roadmap

Create a prioritized roadmap:

- fix now
- standardize next
- automate later
- retire soon

Use `${CLAUDE_SKILL_ROOT}/assets/skill-roadmap-template.md` as the output structure.

Prioritize by:

- impact
- risk
- maintenance burden
- adoption level

## Phase 5: Review

Check against:

- `${CLAUDE_SKILL_ROOT}/references/review-default.md`
- `${CLAUDE_SKILL_ROOT}/references/portfolio-policy.md`

Verify:

- policy is concrete enough to operate
- lifecycle stages have entry rules
- metrics are measurable
- ownership is clear
- retirement criteria exist

## Output format

Return exactly these sections:

### Current-state summary

### Skill inventory model

### Lifecycle policy

### Governance rules

### Metrics dashboard definition

### 30-day roadmap

### 90-day roadmap

### Risks and open decisions

## Anti-patterns

Do not:

- write abstract policy with no operating rules
- ignore ownership
- ignore retirement
- require eval maturity that the team cannot sustain
- assume all skills should be auto-invoked

## Failure handling

If the team has no current inventory:

- provide a lightweight bootstrap policy
- define a minimum viable governance model
- prioritize inventory, naming, and eval basics first
