import { fetchInvoice } from '../api/invoice';

export async function InvoiceTotal({ id }: { id: string }) {
  const invoice = await fetchInvoice(id);
  return <div>{invoice.total - invoice.discount.amount}</div>;
}
