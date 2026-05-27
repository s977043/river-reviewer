# Community Skill Eval Runbook (#868 Phase 3 / #911 Phase 1 promotion)

Workflow to generate verified `golden/` outputs for community skills and
promote them from `recommended: false` to `recommended: true` in
`skills/registry.yaml`.

## Setup (one-time): API key secrets

The eval needs at least one LLM provider key. Add as repo secrets:

- `OPENAI_API_KEY`—enables the OpenAI provider tests
- `ANTHROPIC_API_KEY`—enables the Anthropic provider tests

Either or both works. The workflow exits 1 if neither is set.

Settings → Secrets and variables → Actions → New repository secret.

## Run

1. Go to **Actions → Promptfoo Eval (community skills) → Run workflow**.
2. (Optional) `skill_filter`—egrep-style filter on the eval config path
   (e.g. `modern-web-semantic` to target one skill).
3. (Optional) `provider_filter`—comma-list of provider IDs to limit cost
   (e.g. `anthropic:claude-3-5-sonnet-20241022`).
4. Wait for the run to finish (≈5-15 min depending on filter).
5. Download the `promptfoo-eval-output` artifact from the run.

## Review and commit goldens

1. Unzip the artifact; you'll get one `<skill-id>.json` per evaluated skill.
2. For each test in each skill, compare the LLM output against the
   `llm-rubric` assertion in `eval/promptfoo.yaml`.
3. If the output matches the rubric and the SKILL.md Output contract:
   - Extract the relevant text block.
   - Save it to `skills/midstream/community/<skill-id>/golden/<fixture-name>.md`.
4. If the output is wrong: fix the prompt (`prompt/system.md` or
   `prompt/user.md`), commit, re-run the workflow until consistent.

## Promote to `recommended: true`

A skill is eligible for `recommended: true` when all of:

- `eval/promptfoo.yaml` exists and all assertions pass on the latest run
- Every fixture has a matching `golden/<fixture-name>.md`
- At least one provider has produced consistent output across 3 runs

Edit `skills/registry.yaml`, flip `recommended: false → true` for the skill,
open a PR referencing the eval artifact URL in the description.

## Cost guidance

- Use `provider_filter` to limit to one provider per run while iterating.
- `temperature: 0.1` is set in the yaml configs; eval reruns should be cheap.
- For #868 Phase 2 skills (6 community skills × 2 fixtures × 2 providers),
  total cost per full run is typically under $1 at current pricing.

## References

- Workflow: `.github/workflows/promptfoo-eval.yml`
- Skill READMEs document the per-skill workflow.
- Issues: [#868](https://github.com/s977043/river-reviewer/issues/868),
  [#911](https://github.com/s977043/river-reviewer/issues/911).
- Promptfoo docs: <https://www.promptfoo.dev/docs/configuration/guide>
