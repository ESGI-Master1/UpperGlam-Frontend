import { ApiSuccessResponse } from '@/types/api';
import { PaymentMethod, PaymentStatus } from '@/types/payment';
import { apiClient } from './client';

export interface CreatePaymentIntentPayload {
  draftId: number | string;
  method: PaymentMethod;
  idempotencyKey: string;
}

export interface PaymentIntentResultDto {
  provider: 'mollie';
  paymentId: string;
  checkoutUrl: string | null;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
}

export const createPaymentIntentRequest = async (
  payload: CreatePaymentIntentPayload
): Promise<PaymentIntentResultDto> => {
  const response = await apiClient.post<ApiSuccessResponse<PaymentIntentResultDto>>(
    '/payments/intents',
    {
      draftId: payload.draftId,
      method: payload.method,
    },
    {
      headers: {
        'Idempotency-Key': payload.idempotencyKey,
      },
    }
  );
  return response.data;
};
