export type PaymentMethod = 'apple_pay' | 'google_pay';

export interface PaymentIntentInput {
  draftId: string;
  method: PaymentMethod;
}

export interface PaymentResult {
  status: 'succeeded' | 'failed';
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
