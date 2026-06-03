---
id: human-judgment-focus-en
title: Human Judgment Focus
---

River Review is **not a tool for replacing human review with AI**. It is a framework that executes your team's review criteria as versioned skills, so that humans can focus on the judgments that truly need them.

## "A review happened" is not "understanding is shared"

Confirming an implementation diff does not, on its own, guarantee shared system understanding or shared design intent. A diff shows _what_ changed, but not _why_ the change is sound or whether it is consistent with prior design decisions.

At the same time, having a human synchronize the full context on every PR does not scale.

- High cognitive load on reviewers
- Increased lead time from review queues
- Review perspectives become tied to individual reviewers
- Re-reading the full context from scratch on every review

River Review lowers this burden while letting humans concentrate on high-risk judgment.

## What River Review reduces / does not replace

The goal of River Review is not to **replace** human judgment, but to **focus** it on high-risk areas.

| Category                          | Content                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| What River Review reduces         | Indiscriminate human sync / shallow diff-only review / reviewer-specific tacit knowledge / re-reading context from zero |
| What River Review does not replace | Final accountability / design decisions / business validity / critical security judgment / approval of irreversible changes |

River Review is a mechanism for increasing the evidence available for a decision — not for delegating responsibility. Final approval and accountability always rest with the human reviewer.

## Risk-based review allocation

Weight your review effort according to the risk of the change. Lean low-risk changes onto River Review skills, and apply heavier human judgment as risk increases.

| Risk   | Lean onto River Review                                                       | Humans focus on                |
| ------ | --------------------------------------------------------------------------- | ------------------------------ |
| Low    | lint / format / naming / docs / simple refactors                            | Exceptions only                |
| Medium | plan-diff conformance / tests / migration policy / API contract             | Design intent, blast radius    |
| High   | detection of auth / payment / personal data / security boundary / irreversible migration | Final judgment and accountable approval |

In high-risk areas, River Review handles detection and presents the evidence; the final "pass / block" decision is made by humans.

## Use cases

River Review reduces repetitive review synchronization and lets human reviewers focus on high-risk judgment.

- **Plan Review** — detect dangerous gaps in requirements, design, and plan before implementation
- **Diff Review** — confirm the implementation diff is consistent with the plan, design, and test policy
- **Test Review** — confirm tests are sufficient against the spec and the risks
- **Review Comment Review** — re-examine whether existing AI or human review comments are valid (see [W-check](../guides/w-check.md))

## Do not over-trust AI review

River Review increases the available evidence, but it is not a complete substitute for human approval. The following areas require human judgment.

- Security boundaries, authentication, and authorization
- Personal data, payments, and data migration
- Irreversible changes

Avoid merging based solely on AI review results in these risk areas. River Review's verdicts (`merge-ready` / `human-review` / `block`) support human judgment; they do not stand in for it.

## Related pages

- [What is River Review](./what-is-river-review.md) — the overall concept
- [Design Philosophy](./design-philosophy.md) — the design thinking in detail
- [Review scope and use cases](./review-scope.md) — the breakdown of review targets
- [W-check (double review) guide](../guides/w-check.md) — re-examining existing review results
