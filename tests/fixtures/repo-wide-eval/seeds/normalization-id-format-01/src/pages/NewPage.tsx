import { fetchAccount } from '../api/account';

export async function NewPage({ accountId }: { accountId: string }) {
  const account = await fetchAccount(accountId);
  return <div>{account.name}</div>;
}
