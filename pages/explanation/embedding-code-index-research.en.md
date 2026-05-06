---
id: embedding-code-index-research-en
---

# Embedding-based code index (research note)

> Status: **Research / Decision pending → defer implementation; revisit once the limits of `heuristic + ripgrep` are clearly visible.**
>
> Related: [#691 research(context): consider an embedding-based code index](https://github.com/s977043/river-reviewer/issues/691) / parent Epic [#650](https://github.com/s977043/river-reviewer/issues/650)

This note is a research record used to decide whether River Reviewer's repo-wide review should adopt an embedding-based code index. It collects responses to the acceptance criteria of Issue #691 in a single file.

## 1. Why consider this (the problem we are trying to solve)

The current context collector (`src/lib/repo-context.mjs`) gathers context from changed files via path heuristics + symbol grep + sibling lookups. This is enough in many cases, but on large repositories the following limits become visible.

- When the same concept is implemented under different names (e.g. `formatUserId` vs. `normaliseAccountIdentifier`), string search struggles to follow it.
- We cannot pick up the semantic relationship between ADRs / specifications (free-form text) and the implementation.
- Cross-file design patterns (e.g. a Repository abstraction scattered across multiple files) are hard to extract.
- On a large monorepo, symbol grep produces too many results and ranking breaks down.

Whether "semantic retrieval" (neighborhood search by meaning) can fill those gaps is the starting point of this study.

## 2. Where ripgrep / heuristic is enough

To make a decision, we separate the **strengths** and the **limits** of the current approach.

### Cases where it suffices

- Test files or locale files with **the same or near-same name** as the changed file
- **Direct usage sites** of an exported symbol (one-hop grep with `rg`)
- **Sibling configs** in the same directory hierarchy
- Projects whose naming and normalization rules **stay aligned across the team**
- Repositories of **roughly 10k files** or fewer

### Cases where the limit becomes visible

- After a **rename**, references to the old name remain only in ADRs.
- **Similar-but-different concepts** (e.g. `User` and `Account` mixed; missing the impact on the other one when changing one).
- **Huge monorepos** (hundreds of thousands of files, millions of lines) where symbol grep results explode.
- **Semantic alignment checks** between docs (`docs/architecture.md`, `pages/explanation/*.md`) and the implementation.

## 3. Candidate architectures (at least two)

### Option A: Local JSONL vector cache (recommend if MVP)

- Input: `*.{ts,tsx,js,mjs,md}` collected via `git ls-files`, **chunked**.
- Embedding model: OpenAI `text-embedding-3-small` (light and cheap) or a BGE-family local ONNX.
- Output: `.river/index/embeddings.jsonl` (one line = one chunk, `{path, startLine, endLine, hash, vector}`).
- Search: top-k via cosine similarity in memory (10k chunks finishes in single-digit ms).
- Incremental update: detect diffs by chunk hash and re-embed only the changed chunks.
- Pros: minimal secret-leak risk, simple dependencies (no vector DB), easy to fit on CI cache.
- Cons: memory pressure grows on giant monorepos (>100k chunks).

### Option B: Remote vector DB (Qdrant / Pinecone / Weaviate)

- Input: same as above.
- Embedding model: same as above.
- Output: managed vector store.
- Search: API call.
- Pros: monorepo scalability, easy cross-repository search.
- Cons: secrets become sensitive (code lives remotely), more dependencies, higher cost, latency from CI environments.

### Option C: Docs-only embedding (first step)

- A subset of Option A. Embed only `pages/`, `docs/`, `README*`, and ADRs; keep ripgrep for code itself.
- Pros: minimal privacy risk (public docs only), small implementation, easy to validate the effect.
- Cons: no cross-code retrieval is gained.

## 4. Risk inventory

| Category                | Risk                                                                                      | Mitigation                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| privacy                 | Source code is sent to an external embedding API.                                         | Go fully local with a local model (BGE-small ONNX), or use Option C (docs only).                                |
| secret leak             | `.env` files etc. are accidentally embedded.                                              | Honor `.gitignore` + an explicit deny list (reuse `schemas/exclude.schema.json`) + entropy-based secret detect. |
| cost                    | OpenAI `text-embedding-3-small` for 10k chunks × 500 tokens ≈ \$0.10 per full reindex.    | Diff-only updates keep monthly cost in cents; only the initial run is expensive.                                |
| latency                 | Embedding + retrieval at every review delays response.                                    | Build the index at build time (CI); only retrieval runs at review time.                                         |
| determinism             | Embedding values may drift across provider updates for the same input.                    | Pin the model version; include the model name in the cache key.                                                 |
| index freshness         | Index updates fall behind the speed of code change.                                       | Re-embed only the diff files on PR, on the fly.                                                                 |
| extra dependencies      | A vector DB / model runtime enters CI dependencies.                                       | Stay within pure Node.js / WASM with Option A + ONNX, marked as an optional dependency.                         |
| eval drift              | Swapping embeddings changes detection on the same PR.                                     | Add an embedding on/off axis to [#688 eval fixtures](https://github.com/s977043/river-reviewer/issues/688).     |
| LLM hallucination boost | Semantic retrieval pulls plausible-but-irrelevant chunks and amplifies LLM hallucination. | Use a retrieval-score threshold and **AND-combine** with ripgrep heuristics (embedding only feeds ranking).     |

## 5. Caching strategy in GitHub Actions

When Option A is adopted:

- Cache `.river/index/` with `actions/cache@v4`. Key: `${{ hashFiles('**/*.{ts,tsx,js,mjs,md}') }}-${{ env.MODEL_VERSION }}`.
- Use `restore-keys` to reuse partial caches → re-embed only diff chunks.
- For a monorepo, split the cache per workspace.
- Secrets stay limited to `OPENAI_API_KEY` (when no vector DB is used).

## 6. Monorepo support

- Declare workspaces with `index.scopes: [packages/*]` in `.river-reviewer.yaml` (future addition).
- Carry `scope: 'packages/foo'` in chunk metadata; on retrieval, prefer the scope of the changed files when picking top-k.
- If it grows too large, switch the discussion to Option B (remote vector DB).

## 7. Cost / latency estimate (Option A)

| Item                          | Mid-size repo (5k files / 25k chunks) | Large monorepo (50k files / 250k chunks) |
| ----------------------------- | ------------------------------------- | ---------------------------------------- |
| Initial embed cost            | about \$0.25                          | about \$2.5                              |
| Diff embed per PR             | < \$0.001                             | < \$0.01                                 |
| Index size (binary float32)   | about 150 MB                          | about 1.5 GB                             |
| Index size (JSONL text)       | about 450 MB                          | about 4.5 GB                             |
| Retrieval latency (in-memory) | 1–3 ms                                | 50–100 ms                                |
| CI cache restore (binary)     | a few seconds                         | one minute or more                       |

> Estimates assume `text-embedding-3-small` (1536 dimensions / about \$0.02 per 1M tokens). Sizes are computed as `chunks × 1536 × 4 bytes` for float32 binary; JSONL text is about 3× that. Implementation must assume a **binary format** (e.g. numpy `.npy`, msgpack, or a custom typed-array dump). Using JSONL in production breaks down at scale.

## 8. Deterministic fallback

Even when implemented, **embedding remains supplementary**: review must still complete via the heuristic path even when retrieval returns nothing. Specifically:

1. Embedding retrieval → fetch top-k chunks.
2. From those, take up to N chunks **not already in the existing ripgrep results** and add them to context.
3. Disable embedding (`config.context.embedding.enabled=false`) / missing index / API failure → heuristic-only operation.

This keeps the existing review output **backward compatible**.

## 9. Coexistence policy with ripgrep / heuristic

- Add the embedding score as a **ranking signal** alongside `pathProximity` / `symbolUsage` etc. introduced for [#689 token budget](https://github.com/s977043/river-reviewer/issues/689) (weight 0.10–0.15).
- Keep candidate **generation** in the heuristic path (using embedding as generator increases hallucination).
- When heuristic and embedding results collide on the same file, the heuristic wins (per-file dedupe).

## 10. Implement as MVP, or defer for now?

**Decision: defer for now. Reconsider when one of the following happens.**

1. [#688 eval fixtures](https://github.com/s977043/river-reviewer/issues/688) records **5 or more cases** where heuristic cannot detect but embedding can.
2. A consuming repository reaches the 50k-file scale and the operations team reports degraded S/N from symbol grep.
3. A new use case — semantic alignment between ADRs / specs ↔ implementation — is formally promoted to an Epic.

Reasons:

- Today's River Reviewer skill set (upstream / midstream) concentrates on "changed files ± one hop," which heuristics already cover well.
- Introducing embeddings adds **dependencies, cost, privacy risk, and eval drift** all at once; we should avoid it until the detection lift is quantified.
- If the [#689 token budget + ranking](https://github.com/s977043/river-reviewer/issues/689) effect can be measured, ranking improvements alone are expected to handle most cases without embeddings.

## 11. Follow-up issue plan if we implement (for reference while deferred)

Suggested issue split when the decision flips to "implement":

1. **secret detect + index exclude policy** — spec for `.river/index.gitignore`, entropy detection.
2. **chunking strategy** — AST chunks for TS/JavaScript vs. naive line-window, heading chunks for Markdown.
3. **local embedder backend (Option A)** — ONNX runtime + BGE-small; CLI: `river index build`.
4. **review-time retrieval integration** — embedding ranker added to `repo-context.mjs`.
5. **CI cache strategy** — `actions/cache` spec for `.river/index/`, incremental update.
6. **eval drift guards** — add an embedding on/off axis to [#688](https://github.com/s977043/river-reviewer/issues/688).
7. **docs-only first step (Option C)** — minimum landing point if a phased introduction is desired.

Each issue is sized to land as an independent PR; whether to group them under an Epic is reconsidered once the decision to introduce embeddings is made.

## Conclusion (summary)

- For now, **heuristic + ripgrep + the [#689 token budget/ranking](https://github.com/s977043/river-reviewer/issues/689) improvements** are sufficient.
- Embeddings carry large trade-offs in **dependencies, privacy, cost, and drift**, and should not be introduced without quantified value.
- Option A (Local JSONL vector cache) is the leading candidate; Option C (docs-only) is a phased-introduction insurance.
- Once any of the §10 trigger conditions is met, update this note and file the follow-up issues.
