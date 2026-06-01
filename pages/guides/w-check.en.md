# W-Check (Double Review) Guide

## Overview

**W-check** (double review) is a feature that passes existing review results from other AI reviewers or human reviewers into River Reviewer for re-verification. River Reviewer cross-references the provided review results against the PR diff, validates the reality of each finding, and outputs a consolidated merge recommendation.

Typical use cases:

- Merge a Claude Code review with a Codex review to catch blind spots each reviewer may have missed
- Cross-check a human reviewer's findings against an AI review to remove hallucinated references
- Triage results from multiple AI tools run in parallel into a single, consolidated output

## Artifact Specification

W-check accepts two artifact types as input: `review-self` and `review-external`.

| Field               | `review-self`                                          | `review-external`                                      |
| ------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| Role                | Implementer's own self-review                          | Output from an external AI or human reviewer           |
| Format              | UTF-8 Markdown free-form (no specific schema required) | UTF-8 Markdown free-form (no specific schema required) |
| Required / Optional | Optional                                               | Optional                                               |
| On missing          | W-check skills skip that input                         | W-check skills skip that input                         |
| Internal provenance | Tracked as `self-review`                               | Tracked as `ai-review` or `human-review`               |

Both artifacts are optional. W-check will still run if only one is provided (degraded mode), but having both enables higher-fidelity synthesis.

For full details, see the `review-self` / `review-external` section in [`pages/reference/artifact-input-contract.md`](../reference/artifact-input-contract.md).

## Running via CLI

### Pattern 1: Specify files individually

```bash
river review exec \
  --artifact review-self=./self-review.md \
  --artifact review-external=./codex-review.md \
  --phase midstream
```

### Pattern 2: Use `--ensemble` to pass a directory at once

Place multiple review result files in a directory and pass them all at once. `--ensemble` merges all `*.md` files in the specified directory in alphabetical order by filename and treats the result as the `review-external` artifact.

```bash
mkdir -p .river/reviews
# Place each review result .md in .river/reviews/
# e.g., .river/reviews/codex.md, .river/reviews/gemini.md, .river/reviews/human.md
river review exec \
  --ensemble .river/reviews/ \
  --phase midstream
```

If both `--artifact review-external` and `--ensemble` are specified, `--ensemble` takes precedence.

## Setting Up in GitHub Actions

GitHub Actions `inputs` do not yet have a built-in field for `review-self` / `review-external` (planned for a future release). As a workaround, you can call `dist/index.mjs` directly to achieve equivalent behavior.

```yaml
- name: Collect external reviews
  run: |
    mkdir -p .river/reviews
    echo "$CODEX_REVIEW" > .river/reviews/codex.md
    echo "$HUMAN_REVIEW" > .river/reviews/human.md
  env:
    CODEX_REVIEW: ${{ vars.CODEX_REVIEW_OUTPUT }}
    HUMAN_REVIEW: ${{ vars.HUMAN_REVIEW_OUTPUT }}

- name: Run W-check
  run: |
    node ${{ github.action_path }}/dist/index.mjs run . \
      --phase midstream \
      --ensemble .river/reviews/
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

> **Note**: The `github.action_path` reference is illustrative. Adjust it to the actual Action path referenced in your workflow (e.g., `$GITHUB_WORKSPACE/runners/github-action`).

## How the Synthesis Skill Works

The synthesis step of W-check is handled by the `rr-midstream-independent-review-synthesis-001` skill (`recommended: true`). It operates in three main steps:

1. **Deduplicate**: When multiple reviewers flag the same location, findings are merged into a single entry based on file path, line range, and evidence text similarity.
2. **Hallucination guard**: Each finding's `evidence` is checked against the actual diff and source files. Findings that reference non-existent code are classified as `dismissed-hallucination` and excluded from the final output.
3. **Merge recommendation**: Based on the presence of confirmed critical / major findings, the skill emits one of `merge-ready`, `human-review`, or `block`.

Full skill reference: [`skills/midstream/community/rr-midstream-independent-review-synthesis-001/SKILL.md`](https://github.com/s977043/river-reviewer/blob/main/skills/midstream/community/rr-midstream-independent-review-synthesis-001/SKILL.md)

## Related Pages

- [Artifact Input Contract](../reference/artifact-input-contract.md) — full specification of `review-self` / `review-external`
- [Independent Review Synthesis skill](https://github.com/s977043/river-reviewer/blob/main/skills/midstream/community/rr-midstream-independent-review-synthesis-001/SKILL.md) — complete synthesis skill rules
- [GitHub Actions Setup](./github-actions.md) — basic GitHub Actions configuration
