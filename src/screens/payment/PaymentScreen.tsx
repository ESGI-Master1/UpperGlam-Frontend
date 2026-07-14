import React, { useEffect, useMemo, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StyleSheet, View } from 'react-native';
import { ANALYTICS_EVENTS, trackEvent, trackScreenView } from '@/analytics';
import {
  createMollieCheckout,
  getAvailableWalletMethods,
  openMollieCheckout,
} from '@/services/paymentService';
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
  const { getDraftById, finalizeDraft, markDraftAsFailed } = useBookings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
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
    if (paymentOptions.length > 0) {
      setSelectedMethod(paymentOptions[0].value);
    }
  }, [paymentOptions]);

  const submitPayment = async (): Promise<void> => {
    if (!draft) {
      setErrorMessage('Réservation introuvable');
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
        });
        setPaymentId(payment.paymentId);
        await openMollieCheckout(payment.checkoutUrl!);
        setErrorMessage('Après paiement, reviens ici puis valide la réservation.');
        return;
      }

      await finalizeDraft(draft.id, selectedMethod, paymentId);
      trackEvent(ANALYTICS_EVENTS.PAYMENT_COMPLETED, {
        screen_name: 'Payment',
        status: 'success',
        code: selectedMethod,
      });
      navigation.navigate('Tabs', { screen: 'Bookings' });
    } catch (error) {
      if (paymentId) {
        markDraftAsFailed(draft.id);
      }
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
    setErrorMessage(null);
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
        Paiement sécurisé via Mollie.
      </Text>

      <Card style={styles.summary}>
        <Text size="sm" color="secondary">
          Montant à payer
        </Text>
        <Text variant="heading" size="xl" weight="bold" color="accent">
          {formatPrice(draft.amount)}
        </Text>
      </Card>

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
            Termine le paiement dans la page Mollie, puis reviens ici pour confirmer la réservation.
          </Text>
        </Card>
      ) : null}

      {errorMessage ? (
        <Text size="sm" color="accent" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}

      <Button
        title={paymentId ? 'Valider mon paiement' : `Payer avec ${PAYMENT_LABELS[selectedMethod]}`}
        onPress={submitPayment}
        loading={isSubmitting}
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
