// Existing API client. Every other call site in the project uses
// formatId before invoking fetchAccount.

import { formatId } from '../utils/formatId';

export async function fetchAccount(id: string): Promise<{ name: string }> {
  const normalized = formatId(id);
  const res = await fetch(`/api/accounts/${normalized}`);
  return res.json();
}
