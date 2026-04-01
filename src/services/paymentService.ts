import { Platform } from 'react-native';
import { createPaymentIntentRequest } from '@/api/payments';
import { PaymentIntentInput, PaymentMethod, PaymentResult } from '@/types/payment';

const toApiId = (value: string): number | string => {
  const numericId = Number(value);
  return Number.isInteger(numericId) ? numericId : value;
};

export const getAvailableWalletMethods = (): PaymentMethod[] => {
  if (Platform.OS === 'ios') {
    return ['apple_pay'];
  }

  if (Platform.OS === 'android') {
    return ['google_pay'];
  }

  return [];
};

export const isWalletPaymentSupported = (): boolean => {
  return getAvailableWalletMethods().length > 0;
};

export const createPlatformPayToken = (method: PaymentMethod): string => {
  return `tok_${method}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

export const processPayment = async (input: PaymentIntentInput): Promise<PaymentResult> => {
  const availableMethods = getAvailableWalletMethods();
  if (availableMethods.length === 0) {
    return {
      status: 'failed',
      transactionId: 'txn_wallet_not_supported',
      errorCode: 'wallet_not_supported',
    };
  }

  if (!availableMethods.includes(input.method)) {
    return {
      status: 'failed',
      transactionId: 'txn_wallet_method_mismatch',
      errorCode: 'wallet_method_mismatch',
    };
  }

  const paymentResult = await createPaymentIntentRequest({
    draftId: toApiId(input.draftId),
    method: input.method,
    platformPayToken: input.platformPayToken,
  });

  if (paymentResult.status !== 'succeeded') {
    return {
      status: 'failed',
      transactionId: paymentResult.transactionId,
      errorCode: 'payment_failed',
    };
  }

  return {
    status: 'succeeded',
    transactionId: paymentResult.transactionId,
    providerReference: paymentResult.providerReference,
  };
};
