---
id: riverbed-memory
title: Riverbed Memory
---

:::info[v1 shipped]
Riverbed Memory v1 is already implemented (#474, `src/lib/riverbed-memory.mjs`). It appends JSON entries that conform to `schemas/riverbed-entry.schema.json` into `.river/memory/index.json`, and CI persists them as GitHub Artifacts via `.github/workflows/riverbed-persist.yml`. See [Use Riverbed Memory](../guides/use-riverbed-memory.md) for usage. v2 (external datastore integration) remains a future plan.
:::

## Overview

Riverbed Memory is the place where context settles—like how a riverbed holds the traces of past flows. It remembers architectural decisions, WontFix items, and prior review outcomes so River Reviewer can stay consistent across PRs and releases. Think of it as a lightweight, auditable memory layer that keeps the stream grounded.

For implementation and operations, see `pages/guides/use-riverbed-memory.md`. For storage details, see `pages/reference/riverbed-storage.md`.

## Scope (v0 → v1 → v2)

- **v0: Stateless**—no persisted context; each review is independent. The behavior at initial release.
- **v1: Minimal memory (current)**—Append JSON records that conform to `schemas/riverbed-entry.schema.json` into `.river/memory/index.json`. Use `npm run eval:all -- --persist-memory` to persist eval results automatically. CI retains them for 90 days as GitHub Artifacts via `.github/workflows/riverbed-persist.yml`.
- **v2: Externalized memory (planned)**—optional Postgres/Redis/vector store backing for teams that need cross-repo recall or long-lived history.

## Storage options

- **GitHub PR comments with hidden markers**: Easy to inspect; survives reruns; limited size; must avoid noisy notifications.
- **GitHub Artifacts (.json per PR)**: The v1 default. Cheap and auditable; expires per retention policy; suited for snapshots.
- **`.river/memory/index.json` (in-repo)**: The v1 default. Versioned alongside code. Can be kept local-only via `.gitignore` if desired.
- **External datastore (Postgres/Redis/vector DB)**: Planned for v2. Scales and can power semantic recall; adds ops overhead and secret management.

## Design trade-offs

- **Cost**: Comments are free; artifacts inexpensive; external stores incur infra costs.
- **Complexity**: Comments/artifacts are simple; repo files need write paths and merge strategy; external DBs require services and rotation.
- **Security**: Comments/artifacts live in GitHub scopes; repo files inherit repo ACLs; external stores need secret handling and network policies.
- **Auditability**: Comments and repo files are human-readable; artifacts are retrievable; external stores need explicit retention/backups.

## Considerations for v2

1. The shape of cross-repo recall APIs (pull / push / search).
2. Embedding model choice and cost estimate if a vector DB is adopted.
3. Sync strategy with `.river/memory/index.json` (local-first / remote-first / merge).
