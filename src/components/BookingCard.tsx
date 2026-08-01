import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Booking } from '@/types/booking';
import { Card, Icon, Text } from '@/ui';
import { formatDateTime, formatPrice } from '@/utils/format';
import { theme } from '@/theme';

interface BookingCardProps {
  booking: Booking;
  providerName: string;
  onPress?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, providerName, onPress }) => {
  const isHome = booking.appointmentMode === 'home';
  const statusLabel = booking.status === 'cancelled' ? 'Annulé' : 'Confirmé';
  const paymentLabel = booking.paymentStatus
    ? `Paiement ${booking.paymentStatus}`
    : booking.transactionId
      ? 'Paiement confirmé'
      : 'Paiement enregistré';

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text variant="heading" size="lg" weight="bold">
          {providerName}
        </Text>
        {onPress ? (
          <Icon name="chevron-right" size={16} color={theme.colors.secondaryText} />
        ) : null}
      </View>
      <Text size="sm" color="secondary" style={styles.detail}>
        {formatDateTime(booking.slot)}
      </Text>
      <View style={styles.modeRow}>
        <Icon
          name={isHome ? 'home-map-marker' : 'storefront-outline'}
          size={14}
          color={theme.colors.secondaryText}
        />
        <Text size="sm" color="secondary">
          {isHome ? 'Rendez-vous à domicile' : 'Rendez-vous en institut'}
        </Text>
      </View>
      {booking.address ? (
        <Text size="sm" color="secondary" style={styles.detail}>
          {booking.address}
        </Text>
      ) : null}
      <Text size="sm" color="accent" style={styles.detail}>
        {formatPrice(booking.amount)}
      </Text>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text size="xs" color="secondary">
            {statusLabel}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text size="xs" color="secondary">
            {paymentLabel}
          </Text>
        </View>
      </View>
      {booking.refundTransactionId ? (
        <Text size="xs" color="secondary" style={styles.detail}>
          Remboursement: {booking.refundTransactionId}
        </Text>
      ) : null}
      <Text size="xs" color="secondary" style={styles.detail}>
        Confirmation: {booking.confirmationCode}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  detail: {
    marginTop: theme.spacing.xs,
  },
  modeRow: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
});
