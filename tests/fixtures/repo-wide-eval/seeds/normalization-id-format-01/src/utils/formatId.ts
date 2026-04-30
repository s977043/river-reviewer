// Project convention: every account / user ID must pass through formatId
// before being sent to the API or rendered into a URL. The function
// lowercases, strips dashes, and re-prefixes with `acc_`.
//
// The new file added in the diff bypasses this helper. A repo-wide
// review with this seed visible should flag the drift.

export function formatId(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  const stripped = trimmed.replace(/[^a-z0-9]/g, '');
  return stripped.startsWith('acc_') ? stripped : `acc_${stripped}`;
}
