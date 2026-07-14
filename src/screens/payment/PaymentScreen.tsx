import React, { useEffect, useMemo, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StyleSheet, View } from 'react-native';
import { PlatformPay, usePlatformPay } from '@stripe/stripe-react-native';
import { ANALYTICS_EVENTS, trackEvent, trackScreenView } from '@/analytics';
import {
  createStripePaymentIntent,
  getAvailableWalletMethods,
  isStripePaymentConfigured,
} from '@/services/paymentService';
import { env } from '@/app/config/env';
import { useBookings } from '@/store';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { PaymentMethod } from '@/types/payment';
import { Button, Card, Container, Text } from '@/ui';
import { formatDateTime, formatPrice } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';

type PaymentRoute = RouteProp<RootStackParamList, 'Payment'>;
type PaymentNavigation = StackNavigationProp<RootStackParamList, 'Payment'>;

interface PaymentOption {
  label: string;
  value: PaymentMethod;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
};

export const PaymentScreen: React.FC = () => {
  const route = useRoute<PaymentRoute>();
  const navigation = useNavigation<PaymentNavigation>();
  const { confirmPlatformPayPayment, isPlatformPaySupported } = usePlatformPay();
  const { getDraftById, finalizeDraft, markDraftAsFailed } = useBookings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWalletSupported, setIsWalletSupported] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    () => getAvailableWalletMethods()[0] ?? 'apple_pay'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const draft = useMemo(
    () => getDraftById(route.params.draftId),
    [getDraftById, route.params.draftId]
  );
  const walletMethods = useMemo(() => getAvailableWalletMethods(), []);
  const paymentOptions = useMemo<PaymentOption[]>(() => {
    return walletMethods.map((method) => ({
      value: method,
      label: PAYMENT_LABELS[method],
    }));
  }, [walletMethods]);
  const hasMultipleWalletOptions = paymentOptions.length > 1;

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_PAYMENT, 'Payment');
  }, []);

  useEffect(() => {
    const checkWalletSupport = async (): Promise<void> => {
      if (!isStripePaymentConfigured()) {
        setIsWalletSupported(false);
        return;
      }

      if (selectedMethod === 'google_pay') {
        setIsWalletSupported(
          await isPlatformPaySupported({
            googlePay: { testEnv: env.stripeGooglePayTestEnv },
          })
        );
        return;
      }

      setIsWalletSupported(await isPlatformPaySupported());
    };

    void checkWalletSupport();
  }, [isPlatformPaySupported, selectedMethod]);

  useEffect(() => {
    if (paymentOptions.length > 0) {
      setSelectedMethod(paymentOptions[0].value);
    }
  }, [paymentOptions]);

  const submitPayment = async (): Promise<void> => {
    if (!draft) {
      setErrorMessage('Réservation introuvable');
      return;
    }

    if (!isStripePaymentConfigured()) {
      setErrorMessage('Stripe n’est pas configuré sur cette application.');
      return;
    }

    if (!isWalletSupported) {
      setErrorMessage('Le paiement wallet n’est pas disponible sur cet appareil.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    trackEvent(ANALYTICS_EVENTS.PAYMENT_INTENT_STARTED, {
      screen_name: 'Payment',
      step: 2,
      status: 'success',
      code: selectedMethod,
    });

    try {
      const paymentIntent = await createStripePaymentIntent({
        draftId: draft.id,
        method: selectedMethod,
      });

      const { error } =
        selectedMethod === 'google_pay'
          ? await confirmPlatformPayPayment(paymentIntent.clientSecret, {
              googlePay: {
                testEnv: env.stripeGooglePayTestEnv,
                merchantName: 'Upper Glam',
                merchantCountryCode: env.stripeMerchantCountryCode,
                currencyCode: paymentIntent.currency,
                billingAddressConfig: {
                  format: PlatformPay.BillingAddressFormat.Full,
                  isPhoneNumberRequired: true,
                  isRequired: true,
                },
              },
            })
          : await confirmPlatformPayPayment(paymentIntent.clientSecret, {
              applePay: {
                merchantCountryCode: env.stripeMerchantCountryCode,
                currencyCode: paymentIntent.currency,
                cartItems: [
                  {
                    label: 'Prestation beauté',
                    amount: draft.amount.toFixed(2),
                    paymentType: PlatformPay.PaymentType.Immediate,
                  },
                  {
                    label: 'Upper Glam',
                    amount: draft.amount.toFixed(2),
                    paymentType: PlatformPay.PaymentType.Immediate,
                  },
                ],
              },
            });

      if (error) {
        markDraftAsFailed(draft.id);
        trackEvent(ANALYTICS_EVENTS.PAYMENT_FAILED, {
          screen_name: 'Payment',
          status: 'error',
          error_code: error.code ?? 'stripe_payment_failed',
        });
        setErrorMessage(error.message ?? 'Le paiement a échoué. Réessaie.');
        return;
      }

      await finalizeDraft(draft.id, selectedMethod, paymentIntent.paymentIntentId);
      trackEvent(ANALYTICS_EVENTS.PAYMENT_COMPLETED, {
        screen_name: 'Payment',
        status: 'success',
        code: selectedMethod,
      });
      navigation.navigate('Tabs', { screen: 'Bookings' });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Erreur de paiement'));
      trackEvent(ANALYTICS_EVENTS.PAYMENT_FAILED, {
        screen_name: 'Payment',
        status: 'error',
        error_code: 'payment_exception',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!draft) {
    return (
      <Container>
        <Text size="sm" color="accent">
          Réservation introuvable.
        </Text>
      </Container>
    );
  }

  return (
    <Container>
      <Text variant="heading" size="xl" weight="bold">
        Paiement
      </Text>
      <Text size="sm" color="secondary" style={styles.subtitle}>
        Créneau: {formatDateTime(draft.slot)}
      </Text>
      <Text size="sm" color="secondary" style={styles.walletSubtitle}>
        Paiement uniquement via wallet mobile natif.
      </Text>

      <Card style={styles.summary}>
        <Text size="sm" color="secondary">
          Montant à payer
        </Text>
        <Text variant="heading" size="xl" weight="bold" color="accent">
          {formatPrice(draft.amount)}
        </Text>
      </Card>

      {hasMultipleWalletOptions ? (
        <View style={styles.methods}>
          {paymentOptions.map((option) => (
            <Button
              key={option.value}
              title={option.label}
              variant={selectedMethod === option.value ? 'primary' : 'outline'}
              onPress={() => setSelectedMethod(option.value)}
              fullWidth
            />
          ))}
        </View>
      ) : null}

      {errorMessage ? (
        <Text size="sm" color="accent" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}

      <Button
        title={`Payer avec ${PAYMENT_LABELS[selectedMethod]}`}
        onPress={submitPayment}
        loading={isSubmitting}
        disabled={!isWalletSupported || !isStripePaymentConfigured()}
        fullWidth
        style={styles.payButton}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    marginTop: theme.spacing.xs,
  },
  walletSubtitle: {
    marginTop: theme.spacing.xs,
  },
  summary: {
    marginTop: theme.spacing.lg,
  },
  methods: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  error: {
    marginTop: theme.spacing.md,
  },
  payButton: {
    marginTop: theme.spacing.lg,
  },
});
