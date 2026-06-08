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

## Execution model (who runs the review)

River Review's skills are not configuration for River Review to call an LLM itself — they are a **capability pack (skills / agent definitions) that strengthens an AI's review ability**. There are three ways they get executed, and **whether an LLM key is needed is decided by this model, not by the execution surface**.

1. **AI-agent-driven (primary)** — an agent (Claude Code / Cursor / Codex …) loads the skills (`skills/agent-skills/`) or the sub-agent (`agents/river-review.md`) and **runs the review with its own model**. The agent _is_ the LLM, so **no River Review LLM key is needed**. This covers `/review-local`, sub-agent delegation, loading Agent Skills, etc.
2. **Mechanical checks (heuristic / no model)** — viewpoints that can be decided deterministically (e.g. via regex) **run with no LLM and no key**. Today this covers hardcoded-secret detection / dangerous `eval` & XSS / disabled TLS verification / merge-conflict markers / GitHub Actions risks / silent-catch / leftover `debugger` / type-check suppression (`@ts-ignore`) / missing tests / focused tests (leftover `.only`), handled by the security, logging, typescript, and test skills. More mechanically-decidable viewpoints can be added over time.
3. **Headless LLM (GitHub Action / standalone `river run`)** — with no interactive agent present, River Review **calls an LLM itself** to execute the skills. **Only this path needs an LLM key** (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_API_KEY`); the mechanical checks (2) still run without one.

> In short: normal AI-driven development needs **no LLM key** because the agent applies the skills. A key is required only for **headless execution (GitHub Action / standalone CLI)** running skills beyond the mechanical checks.

## Flow Connection

- **Upstream**: Check requirements, design, and ADRs to reduce downstream risks.
- **Midstream**: Review code and PRs, ensuring alignment between design intent and implementation diffs.
- **Downstream**: Check tests, QA, and release readiness to prevent regression and quality degradation.
