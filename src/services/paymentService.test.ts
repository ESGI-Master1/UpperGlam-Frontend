import { Linking, Platform } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPaymentIntentRequest } from '@/api/payments';
import {
  createMollieCheckout,
  getAvailableWalletMethods,
  openMollieCheckout,
  toPaymentApiId,
} from './paymentService';

vi.mock('@/api/payments', () => ({
  createPaymentIntentRequest: vi.fn(),
}));

vi.mock('react-native', () => ({
  Linking: {
    canOpenURL: vi.fn(),
    openURL: vi.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

const createPaymentIntentMock = vi.mocked(createPaymentIntentRequest);
const canOpenUrlMock = vi.mocked(Linking.canOpenURL);
const openUrlMock = vi.mocked(Linking.openURL);

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Platform.OS = 'ios';
  });

  it('normalizes numeric draft ids for the API and keeps external ids as strings', () => {
    expect(toPaymentApiId('42')).toBe(42);
    expect(toPaymentApiId('draft_ext_42')).toBe('draft_ext_42');
  });

  it('returns the wallet method supported by the current platform', () => {
    Platform.OS = 'ios';
    expect(getAvailableWalletMethods()).toEqual(['apple_pay']);

    Platform.OS = 'android';
    expect(getAvailableWalletMethods()).toEqual(['google_pay']);

    Platform.OS = 'web';
    expect(getAvailableWalletMethods()).toEqual([]);
  });

  it('creates a Mollie checkout with idempotency and rejects missing checkout URLs', async () => {
    createPaymentIntentMock.mockResolvedValueOnce({
      provider: 'mollie',
      paymentId: 'tr_test',
      checkoutUrl: 'https://checkout.test/tr_test',
      status: 'processing',
      amountCents: 6500,
      currency: 'EUR',
    });

    await expect(
      createMollieCheckout({
        draftId: '42',
        method: 'apple_pay',
        idempotencyKey: 'idem_123',
      })
    ).resolves.toMatchObject({ paymentId: 'tr_test' });

    expect(createPaymentIntentMock).toHaveBeenCalledWith({
      draftId: 42,
      method: 'apple_pay',
      idempotencyKey: 'idem_123',
    });

    createPaymentIntentMock.mockResolvedValueOnce({
      provider: 'mollie',
      paymentId: 'tr_no_url',
      checkoutUrl: null,
      status: 'processing',
      amountCents: 6500,
      currency: 'EUR',
    });

    await expect(
      createMollieCheckout({
        draftId: '42',
        method: 'apple_pay',
        idempotencyKey: 'idem_124',
      })
    ).rejects.toThrow('URL de paiement Mollie manquante');
  });

  it('opens checkout URLs only when the OS can handle them', async () => {
    canOpenUrlMock.mockResolvedValueOnce(true);

    await openMollieCheckout('https://checkout.test/tr_test');

    expect(openUrlMock).toHaveBeenCalledWith('https://checkout.test/tr_test');

    canOpenUrlMock.mockResolvedValueOnce(false);

    await expect(openMollieCheckout('https://checkout.test/tr_test')).rejects.toThrow(
      'Impossible d’ouvrir la page de paiement Mollie'
    );
  });
});
