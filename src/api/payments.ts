import { ApiSuccessResponse } from '@/types/api';
import { PaymentMethod } from '@/types/payment';
import { apiClient } from './client';

export interface CreatePaymentIntentPayload {
  draftId: number | string;
  method: PaymentMethod;
  platformPayToken: string;
}

export interface PaymentIntentResultDto {
  status: 'succeeded' | 'failed';
  transactionId: string;
  providerReference?: string;
}

export const createPaymentIntentRequest = async (
  payload: CreatePaymentIntentPayload
): Promise<PaymentIntentResultDto> => {
  const response = await apiClient.post<ApiSuccessResponse<PaymentIntentResultDto>>(
    '/payments/intents',
    payload
  );
  return response.data;
};
