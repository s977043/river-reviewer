// API client. The Invoice contract treats `discount` as nullable —
// invoices that have no promotional discount applied carry a literal
// null. Every call site is expected to null-check before reading
// `discount.amount`.

export interface Invoice {
  id: string;
  total: number;
  discount: { amount: number; reason: string } | null;
}

export async function fetchInvoice(id: string): Promise<Invoice> {
  const res = await fetch(`/api/invoices/${id}`);
  return (await res.json()) as Invoice;
}
