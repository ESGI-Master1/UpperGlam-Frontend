import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppState, Linking, StyleSheet, View } from 'react-native';
import { env } from '@/app/config/env';
import { ANALYTICS_EVENTS, trackEvent, trackScreenView } from '@/analytics';
import {
  createMollieCheckout,
  getAvailablePaymentMethods,
  openMollieCheckout,
} from '@/services/paymentService';
import { useBookings } from '@/store';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { PaymentMethod } from '@/types/payment';
import { Booking } from '@/types/booking';
import { Button, Card, Container, Text } from '@/ui';
import { formatDateTime, formatPrice } from '@/utils/format';
import { getErrorCode, getErrorMessage } from '@/utils/errors';

type PaymentRoute = RouteProp<RootStackParamList, 'Payment'>;
type PaymentNavigation = StackNavigationProp<RootStackParamList, 'Payment'>;

interface PaymentOption {
  label: string;
  value: PaymentMethod;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  card: 'Carte bancaire',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
};

const PAYMENT_CONFIRMATION_ATTEMPTS = 6;
const PAYMENT_CONFIRMATION_DELAY_MS = 1500;

const createPaymentAttemptKey = (draftId: string): string => {
  return `payment:${draftId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
};

const wait = (durationMs: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
};

const isMollieReturnUrl = (url: string): boolean => {
  return url.startsWith(env.mollieReturnUrl);
};

export const PaymentScreen: React.FC = () => {
  const route = useRoute<PaymentRoute>();
  const navigation = useNavigation<PaymentNavigation>();
  const { getDraftById, finalizeDraft, markDraftAsFailed } = useBookings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    () => getAvailablePaymentMethods()[0] ?? null
  );
  const [paymentAttemptKey, setPaymentAttemptKey] = useState(() =>
    createPaymentAttemptKey(route.params.draftId)
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const confirmationInProgressRef = useRef(false);
  const checkoutWasBackgroundedRef = useRef(false);

  const draft = useMemo(
    () => getDraftById(route.params.draftId),
    [getDraftById, route.params.draftId]
  );
  const availableMethods = useMemo(() => getAvailablePaymentMethods(), []);
  const paymentOptions = useMemo<PaymentOption[]>(() => {
    return availableMethods.map((method) => ({
      value: method,
      label: PAYMENT_LABELS[method],
    }));
  }, [availableMethods]);
  const hasMultipleWalletOptions = paymentOptions.length > 1;

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_PAYMENT, 'Payment');
  }, []);

  useEffect(() => {
    if (paymentOptions.length > 0 && !selectedMethod) {
      setSelectedMethod(paymentOptions[0].value);
    }
  }, [paymentOptions, selectedMethod]);

  const confirmPayment = useCallback(async (): Promise<void> => {
    if (
      !draft ||
      !selectedMethod ||
      !paymentId ||
      confirmedBooking ||
      confirmationInProgressRef.current
    ) {
      return;
    }

    confirmationInProgressRef.current = true;
    setIsSubmitting(true);
    setErrorMessage('Confirmation du paiement en cours…');

    try {
      for (let attempt = 0; attempt < PAYMENT_CONFIRMATION_ATTEMPTS; attempt += 1) {
        try {
          const booking = await finalizeDraft(draft.id, selectedMethod, paymentId);
          setConfirmedBooking(booking);
          setErrorMessage(null);
          trackEvent(ANALYTICS_EVENTS.PAYMENT_COMPLETED, {
            screen_name: 'Payment',
            status: 'success',
            code: selectedMethod,
          });
          return;
        } catch (error) {
          const errorCode = getErrorCode(error);
          const canRetry =
            errorCode === 'PAYMENT_PENDING' && attempt < PAYMENT_CONFIRMATION_ATTEMPTS - 1;

          if (canRetry) {
            await wait(PAYMENT_CONFIRMATION_DELAY_MS);
            continue;
          }

          if (errorCode === 'PAYMENT_NOT_CONFIRMED') {
            markDraftAsFailed(draft.id);
          }

          throw error;
        }
      }
    } catch (error) {
      setErrorMessage(
        getErrorCode(error) === 'PAYMENT_PENDING'
          ? 'Mollie confirme encore le paiement. Réessaie dans quelques secondes.'
          : getErrorMessage(error, 'Erreur de confirmation du paiement')
      );
      trackEvent(ANALYTICS_EVENTS.PAYMENT_FAILED, {
        screen_name: 'Payment',
        status: 'error',
        error_code: getErrorCode(error) ?? 'payment_confirmation_exception',
      });
    } finally {
      confirmationInProgressRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    confirmedBooking,
    draft,
    finalizeDraft,
    markDraftAsFailed,
    paymentId,
    selectedMethod,
  ]);

  useEffect(() => {
    const urlSubscription = Linking.addEventListener('url', ({ url }) => {
      if (isMollieReturnUrl(url)) {
        void confirmPayment();
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        checkoutWasBackgroundedRef.current = true;
        return;
      }

      if (checkoutWasBackgroundedRef.current && paymentId) {
        checkoutWasBackgroundedRef.current = false;
        void confirmPayment();
      }
    });

    return () => {
      urlSubscription.remove();
      appStateSubscription.remove();
    };
  }, [confirmPayment, paymentId]);

  const submitPayment = async (): Promise<void> => {
    if (!draft) {
      setErrorMessage('Réservation introuvable');
      return;
    }

    if (!selectedMethod) {
      setErrorMessage('Aucun moyen de paiement compatible n’est disponible sur cet appareil.');
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
      if (!paymentId) {
        const payment = await createMollieCheckout({
          draftId: draft.id,
          method: selectedMethod,
          idempotencyKey: paymentAttemptKey,
        });
        setPaymentId(payment.paymentId);
        await openMollieCheckout(payment.checkoutUrl!);
        setErrorMessage('Termine le paiement dans Mollie. La confirmation sera automatique.');
        return;
      }

      await confirmPayment();
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

  const restartPayment = (): void => {
    setPaymentId(null);
    setPaymentAttemptKey(createPaymentAttemptKey(route.params.draftId));
    setErrorMessage(null);
  };

  const openBookings = (): void => {
    navigation.navigate('Tabs', { screen: 'Bookings' });
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

  if (confirmedBooking) {
    return (
      <Container>
        <Text variant="heading" size="xl" weight="bold">
          Paiement confirmé
        </Text>
        <Card style={styles.summary}>
          <Text size="sm" color="secondary">
            Réservation
          </Text>
          <Text size="lg" weight="bold">
            {confirmedBooking.confirmationCode}
          </Text>
          <Text size="sm" color="secondary">
            {formatDateTime(confirmedBooking.slot)}
          </Text>
          <Text size="sm" color="secondary">
            {formatPrice(confirmedBooking.amount)} ·{' '}
            {PAYMENT_LABELS[confirmedBooking.paymentMethod]}
          </Text>
          {confirmedBooking.transactionId ? (
            <Text size="xs" color="secondary">
              Transaction {confirmedBooking.transactionId}
            </Text>
          ) : null}
        </Card>
        <Button
          title="Voir mes rendez-vous"
          onPress={openBookings}
          fullWidth
          style={styles.payButton}
        />
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
        Paiement par carte sécurisé via Mollie.
      </Text>

      <Card style={styles.summary}>
        <Text size="sm" color="secondary">
          Montant à payer
        </Text>
        <Text variant="heading" size="xl" weight="bold" color="accent">
          {formatPrice(draft.amount)}
        </Text>
      </Card>

      {paymentOptions.length === 0 ? (
        <Card style={styles.statusCard}>
          <Text size="sm" weight="semibold">
            Paiement indisponible
          </Text>
          <Text size="sm" color="secondary">
            Aucun moyen de paiement n’est disponible sur cet appareil.
          </Text>
        </Card>
      ) : null}

      {!paymentId && hasMultipleWalletOptions ? (
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

      {paymentId ? (
        <Card style={styles.statusCard}>
          <Text size="sm" weight="semibold">
            Paiement Mollie ouvert
          </Text>
          <Text size="sm" color="secondary">
            Termine le paiement dans la page Mollie puis reviens dans l’application. La réservation
            sera confirmée automatiquement.
          </Text>
        </Card>
      ) : null}

      {errorMessage ? (
        <Text size="sm" color="accent" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}

      <Button
        title={
          paymentId
            ? 'Vérifier le paiement'
            : selectedMethod
              ? `Payer avec ${PAYMENT_LABELS[selectedMethod]}`
              : 'Paiement indisponible'
        }
        onPress={submitPayment}
        loading={isSubmitting}
        disabled={!selectedMethod}
        fullWidth
        style={styles.payButton}
      />
      {paymentId ? (
        <Button
          title="Recommencer le paiement"
          variant="tertiary"
          onPress={restartPayment}
          fullWidth
          style={styles.secondaryButton}
        />
      ) : null}
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
  statusCard: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  error: {
    marginTop: theme.spacing.md,
  },
  payButton: {
    marginTop: theme.spacing.lg,
  },
  secondaryButton: {
    marginTop: theme.spacing.sm,
  },
});
