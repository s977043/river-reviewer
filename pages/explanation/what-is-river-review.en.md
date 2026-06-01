---
id: what-is-river-review-en
title: What is River Review
---

River Review is a **Context Engineering-driven, Skill Registry-centric code review framework** — a flow-based agent that carries review perspectives along [three phases (Upstream, Midstream, Downstream)](./upstream-midstream-downstream.md) as reusable **Agent Skills**.

By defining team-specific judgment criteria and procedures as version-controlled **Agent Skills**, it makes review findings reproducible while keeping operating costs in check.

## Purpose

- Detect drift and risks early in the design phase.
- Standardize review perspectives without stalling implementation reviews.
- Reduce regression and coverage gaps before test/release.

## Positioning

River Review does not replace human reviewers. By handling skill-based checks to reduce oversights, it allows humans to focus on intent and team-specific judgments.

## Flow Connection

- **Upstream**: Check requirements, design, and ADRs to reduce downstream risks.
- **Midstream**: Review code and PRs, ensuring alignment between design intent and implementation diffs.
- **Downstream**: Check tests, QA, and release readiness to prevent regression and quality degradation.
