# Config / Schema Overview

## `.river-reviewer.json` (Runtime Config)

Place `.river-reviewer.json` in the repository root to customize review model settings and exclusion conditions. Verified by Zod schema in `src/config/schema.mjs`. Defaults to `src/config/default.mjs` if missing.

### Support Items and Defaults

- `model`
  - `provider`: `openai` (Default). The config schema also accepts `google` / `anthropic`, but the current review pipeline is OpenAI-only (see #490).
  - `modelName`: `gpt-4o-mini` (Default)
  - `temperature`: `0`
  - `maxTokens`: `600`
- `review`
  - `language`: `ja` (Japanese) / `en` (English). Switches prompt body and output language.
  - `severity`: `normal` (Default) / `strict` / `relaxed`
  - `additionalInstructions`: Additional review policies (array). Listed at the end of the prompt.
- `exclude`
  - `files`: Glob patterns to exclude from change diffs.
  - `prLabelsToIgnore`: Skips review if Pull Request label contains target keywords. Matches partial case-insensitive against `RIVER_PR_LABELS` (comma separated) or GitHub Actions `GITHUB_EVENT_PATH`.
- `security` ([#692](https://github.com/s977043/river-reviewer/issues/692))
  - `redact.enabled`: `true` (default). Redacts secrets in repo-wide context and prompts before sending to the LLM.
  - `redact.categories`: Toggle individual categories. Keys:
    - Keys: `githubToken` / `openaiKey` / `anthropicKey` / `googleApiKey` / `awsAccessKey` / `awsSecretKey` / `privateKey`
    - Auth: `bearerToken` / `databaseUrl` / `webhookUrl` / `oauthSecret` / `envAssignment`
    - Fallback: `highEntropy`
  - `redact.extraPatterns`: Additional regex (`{ id, pattern, replacement? }`) for project-specific key formats.
  - `redact.allowlist`: Tokens matching these strings are not redacted (useful for protecting test fixtures).
  - `redact.denyFiles`: Globs added to the path-level deny list (on top of the built-in `.env*` / `*.pem` / `*.key` / `secrets.*`).
  - `redact.entropyThreshold`: `3.0`–`6.0` (default `4.5`). Threshold for the Shannon-entropy fallback detector.
  - `redact.entropyMinLength`: Default `24`. Minimum substring length the fallback detector considers.
- `memory` ([#687](https://github.com/s977043/river-reviewer/issues/687))
  - `suppressionEnabled`: `true` (default). Applies suppression entries from Riverbed Memory. Set to `false` to bypass the gate (emergency override).
- `context` ([#689](https://github.com/s977043/river-reviewer/issues/689))
  - `reviewMode`: `tiny` / `medium` / `large`. When `budget` is omitted, the preset from `src/lib/context-presets.mjs` is applied. An explicit `budget` always wins.
  - `budget.maxTokens`: `256`–`64000`.
  - `budget.maxChars`: `1024`–`200000`. Both char and token caps apply simultaneously.
  - `budget.perSectionCaps`: Per-section char caps for `fullFile` / `tests` / `usages` / `config`.
  - `ranking.enabled`: `true` to enable proximity-based reordering of context candidates.
  - `ranking.weights`: Per-signal weights for `pathProximity` / `symbolUsage` / `siblingTest` / `commitRecency`, each in `0.0`–`1.0`. Equal weighting if omitted.
  - `tokenizer`: Only `heuristic` is accepted (reserved for future expansion).

### Configuration Example

```json
{
  "model": { "provider": "openai", "modelName": "gpt-4o", "temperature": 0.2 },
  "review": {
    "language": "en",
    "severity": "strict",
    "additionalInstructions": ["Focus on security", "Prefer readable variable names"]
  },
  "exclude": {
    "files": ["**/*.md", "docs/**"],
    "prLabelsToIgnore": ["no-review", "wip"]
  }
}
```

### Operational Tips

- List labels to skip in CI in `prLabelsToIgnore` and ensure they can be read from `RIVER_PR_LABELS` (e.g., `RIVER_PR_LABELS=no-review,wip`) or GitHub event payload.
- Verify schema integrity and behavior with `npm test` or `npm run lint` after changing settings.

## JSON Schema (Skill / Output)

River Reviewer defines skills and outputs using JSON Schema. Skills assume YAML frontmatter, outputs assume JSON.

- `schemas/skill.schema.json`
  - Required: `id` / `name` / `description` / `category` (plus one of `phase` / `category` / `trigger`, and one of `applyTo` / `files` / `path_patterns` / `trigger`)
  - Optional: `tags` / `severity` / `inputContext` / `outputKind` / `modelHint` / `dependencies`
  - `category` is one of `core` / `upstream` / `midstream` / `downstream` and is the primary routing key. `phase` is kept for backward compatibility.

- `schemas/output.schema.json`
  - Required: `issue` / `rationale` / `impact` / `suggestion` / `priority` / `skill_id`
  - `priority`: `P0` to `P3`

Skills are placed as Markdown files in `skills/{category}/` and can be schema-validated with `npm run skills:validate`.
