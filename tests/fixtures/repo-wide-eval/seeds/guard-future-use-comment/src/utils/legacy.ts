// Seed for guard-future-use-comment.
//
// This file is intentionally kept around during the v2 migration. The
// diff replaces a stale TODO with a precise rationale linking to the
// migration plan. There is nothing to flag — a finding here would be a
// false positive (the change improves the comment, does not introduce
// risk).

export interface LegacyConfig {
  token: string;
}

// Kept intentionally during the v2 migration (see ADR-007). Removal is
// blocked on the legacy ingestion job migrating to the new config —
// tracked in https://example.com/issues/legacy-config and slated for
// the next release after that lands.
export function loadLegacyConfig(): LegacyConfig {
  return { token: process.env.LEGACY_TOKEN ?? '' };
}
