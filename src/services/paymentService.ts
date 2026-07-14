import { Platform } from 'react-native';
import { createPaymentIntentRequest } from '@/api/payments';
import { env } from '@/app/config/env';
import { PaymentIntentInput, PaymentMethod } from '@/types/payment';

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

export const isStripePaymentConfigured = (): boolean => {
  return env.stripePublishableKey.trim().length > 0;
};

export const createStripePaymentIntent = async (input: PaymentIntentInput) => {
  return createPaymentIntentRequest({
    draftId: toApiId(input.draftId),
    method: input.method,
  });
};
