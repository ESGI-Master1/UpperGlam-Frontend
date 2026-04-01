export type PaymentMethod = 'apple_pay' | 'google_pay';

export interface PaymentIntentInput {
  draftId: string;
  method: PaymentMethod;
  platformPayToken: string;
}

export interface PaymentResult {
  status: 'succeeded' | 'failed';
  transactionId: string;
  providerReference?: string;
  errorCode?: 'wallet_not_supported' | 'wallet_method_mismatch' | 'payment_failed';
}
