# npm Distribution Design (#800 B1)

This doc captures the design decisions and the `npm pack --dry-run` audit findings for [#800 npm 公開またはインストール可能な配布手段の提供](https://github.com/s977043/river-reviewer/issues/800). It is the B1 deliverable: **design + audit only, no implementation**. Implementation (B2) is a separate slice.

## Audit (v0.55.0, `npm pack --dry-run`)

| Metric                             | Current                                                                                          | Concern                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `package.json#private`             | `true`                                                                                           | Blocks publish; must be removed (or set to `false`) before B2 |
| `package.json#files`               | unset                                                                                            | Without `files`, npm includes the entire repo                 |
| `package.json#exports`             | unset                                                                                            | No public Node API surface; consumers can only use the CLI    |
| `package.json#main`                | unset                                                                                            | OK for CLI-only; if Node API is desired, must be set          |
| Tarball size                       | **1.9 MB** (compressed) / **8.3 MB unpacked**                                                    | Heavy. Most of the weight is `pages/` / `tests/` / `docs/`    |
| Total files                        | **969**                                                                                          | Far too many for a CLI distribution                           |
| Top contributors                   | `skills/` (227) / `tests/` (193) / `pages/` (158) / `src/` (75) / `runners/` (61) / `docs/` (31) | Several categories should be excluded                         |
| `bin.river` / `bin.river-reviewer` | `./src/cli.mjs`                                                                                  | OK                                                            |
| `engines.node`                     | `22.x`                                                                                           | Strict; consumers on Node 20 LTS will fail install            |

### What goes in the tarball today (categories that are concerning)

- **`tests/`** (193 files): test sources shipped to consumers—wasted size, no value.
- **`pages/`** (158 files): Docusaurus content. Useful as a website, not as a npm dependency.
- **`docs/`** (31 files): internal developer docs. Not user-facing.
- **`schemas/`** (12 files): probably needed if consumers validate skill output via the package; keep.
- **`examples/`** (15 files): borderline; could be excluded with a separate "examples" repo, kept for now.

## Hidden risks (Codex multi-perspective review, 2026-05-24)

### 1. CLI 境界混乱 (`npx river review`)

Two CLIs exist in the repo:

| CLI                              | `package.json#name`          | `bin`                      | Subcommands                                                                                            |
| -------------------------------- | ---------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| Main (`src/cli.mjs`)             | `river-reviewer` (root)      | `river` / `river-reviewer` | `run` / `skills` / `doctor` / `review plan` / `review exec` / `review verify` / `eval` / `suppression` |
| Runner (`runners/cli/bin/river`) | `@river-reviewer/cli-runner` | `river` (workspace-local)  | `review` / `eval` / `create skill`                                                                     |

The two CLIs have **overlapping command names** (`review`, `eval`). When `river-reviewer` is published to npm and a user runs `npx river-reviewer review …`, it routes to the **main CLI's `river review plan|exec|verify`**, not the Runner CLI's `review`. This is the correct behaviour for the v0.55.0 / Phase 3 use case, but adopters expecting the Runner CLI's `river review [files...]` will be surprised.

**Decision**: Publish only the main CLI as `river-reviewer`. Document the Runner CLI as a contributor-only tool in `runners/cli/README.md`. Do not publish `@river-reviewer/cli-runner` to npm.

### 2. Node 22 strict requirement

`engines.node: "22.x"` will refuse install on Node 18 (out of LTS support window) and Node 20 (still in LTS). The CI matrix runs both 20.x and 22.x.

**Decision**: Relax to `engines.node: ">=20"` before publish; the test matrix already covers 20.x, and 22 features used in the code paths can be guarded.

### 3. GitHub Action dist staleness on consumer installs

`runners/github-action/dist/index.mjs` is the bundled artifact consumed by the GitHub Action workflow. If shipped via npm without rebuilding on install, consumers may receive a stale dist mismatched with the npm `src/` they install.

**Decision**: Either (a) exclude `runners/github-action/dist/` from the npm tarball entirely (GitHub Action consumers use `@v0.x.x` tags directly from the repo, not via npm) or (b) include and document the freshness check. **(a) is simpler and matches current GitHub Action user behaviour.**

### 4. Riverbed Memory / artifact runtime paths

`runReviewPlan` reads `.river/risk-map.yaml` and writes to `.river/runs/` / `.river/memory/`. When invoked from a globally-installed `npx river run`, these paths resolve relative to the **consumer's repo**, which is correct. But the install itself must not assume `.river/` exists at the install location.

**Decision**: No code change needed; `loadRiskMap` already returns `null` on ENOENT (A2-fix-4 #877 guarantee). Document this behaviour in the publish notes.

## Proposed `package.json` patch (B2 implementation reference)

```diff
 {
   "name": "river-reviewer",
   "version": "0.55.0",
-  "private": true,
+  "private": false,
   "bin": {
     "river": "./src/cli.mjs",
     "river-reviewer": "./src/cli.mjs"
   },
+  "files": [
+    "src/",
+    "runners/core/",
+    "runners/node-api/",
+    "skills/",
+    "schemas/",
+    "templates/",
+    "scripts/",
+    "README.en.md",
+    "LICENSE-CODE",
+    "LICENSE-CONTENT"
+  ],
+  "publishConfig": {
+    "access": "public",
+    "registry": "https://registry.npmjs.org/"
+  },
-  "engines": { "node": "22.x" }
+  "engines": { "node": ">=20" }
 }
```

> `README.md`, `LICENSE`, `package.json` は npm が `files` 指定の有無に関わらず自動でパッケージに含めるため、明示列挙は不要 (npm-publish documentation の "Files included" 参照)。`AGENT_LEARNINGS.md` は contributor 向けの内部ドキュメントなので除外する。

### What is NOT included in `files`

- `pages/`—Docusaurus website, not a npm dependency
- `tests/`—npm consumers don't need them
- `docs/`—internal developer docs
- `runners/github-action/`—GitHub Action workflow consumes the repo directly via `@v0.x.x`, not via npm
- `examples/`—keep separate (or include with explicit decision)
- `.river/`—runtime artifact directory, never published
- Various `*.config.*` (Docusaurus / Vercel / Babel)—site / dev only

### Expected size after `files` allowlist

- Tarball: **~300-500 KB** (down from 1.9 MB)
- Unpacked: **~1.5-2 MB** (down from 8.3 MB)
- File count: **~400** (down from 969)

These are estimates; exact numbers should come from `npm pack --dry-run` in B2.

## Out of scope for B1

- `npx river try` quick-start command (separate slice C3)
- Sample skill pack curation for the npm tarball
- npm scoped package strategy (`@river-reviewer/*`)
- Automated publish workflow (release-please-action integration)
- Cross-platform install testing (Node 20 / 22 on macOS / Linux / Windows)

These should be sequenced after B2 lands.

## Acceptance criteria for B1 (this doc)

- [x] `npm pack --dry-run` audit captured with concrete numbers
- [x] Hidden risks enumerated (Codex multi-perspective review derived)
- [x] Specific `package.json` patch documented as B2 reference
- [x] `files` allowlist categorized into "include / exclude / borderline"
- [x] CLI 境界混乱 decision recorded
- [x] Node engines decision recorded
- [x] GitHub Action dist handling decision recorded

## References

- [#800](https://github.com/s977043/river-reviewer/issues/800)—npm 配布 parent issue
- [`pages/reference/stable-interfaces.md`](../../pages/reference/stable-interfaces.md)—public API surface
- [`runners/cli/README.md`](../../runners/cli/README.md)—Runner CLI documentation
- [`docs/development/execution-context-contract.md`](./execution-context-contract.md)—runtime contract
