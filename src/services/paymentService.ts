import { Linking, Platform } from 'react-native';
import { createPaymentIntentRequest } from '@/api/payments';
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

  return ['apple_pay', 'google_pay'];
};

export const createMollieCheckout = async (input: PaymentIntentInput) => {
  const payment = await createPaymentIntentRequest({
    draftId: toApiId(input.draftId),
    method: input.method,
  });

  if (!payment.checkoutUrl) {
    throw new Error('URL de paiement Mollie manquante');
  }

  return payment;
};

export const openMollieCheckout = async (checkoutUrl: string): Promise<void> => {
  const canOpen = await Linking.canOpenURL(checkoutUrl);
  if (!canOpen) {
    throw new Error('Impossible d’ouvrir la page de paiement Mollie');
  }

  await Linking.openURL(checkoutUrl);
};
