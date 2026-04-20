# Quickstart (River Reviewer)

This guide covers the minimal configuration to get River Reviewer running.

1. Prepare `skills/{upstream,midstream,downstream}` in your repository and create skills using Markdown + YAML frontmatter (Refer to `schemas/skill.schema.json`).
2. Add a GitHub Actions workflow to `.github/workflows/river-reviewer.yml` or similar.
3. Configure `OPENAI_API_KEY` in your repository Secrets for the default GitHub Action. Additional tokens are only needed for custom integrations or extensions.
4. Create a PR and verify that skills for the specified phase are executed.

Refer to the root `README.md` for a minimal Actions definition sample.
