export type PaymentMethod = 'apple_pay' | 'google_pay';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

export interface PaymentIntentInput {
  draftId: string;
  method: PaymentMethod;
  idempotencyKey: string;
}

export interface PaymentResult {
  status: PaymentStatus;
  transactionId: string;
  paymentIntentId?: string;
  providerReference?: string;
  clientSecret?: string;
  errorCode?:
    | 'stripe_not_configured'
    | 'wallet_not_supported'
    | 'wallet_method_mismatch'
    | 'payment_cancelled'
    | 'payment_failed';
}
