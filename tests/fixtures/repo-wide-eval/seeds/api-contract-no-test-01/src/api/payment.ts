import { httpPost } from '../http/client';

export interface PaymentRequest {
  amount: number;
  currency: string;
  /** New required field — server now rejects requests without it. */
  idempotencyKey: string;
}

export async function createPayment(req: PaymentRequest) {
  return httpPost('/api/payments', req);
}
