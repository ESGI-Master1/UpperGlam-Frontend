import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import {
  createProviderAvailabilityRequest,
  deleteProviderAvailabilityRequest,
  listProviderAvailabilityRequest,
  listProviderBookingsRequest,
} from '@/api/providerDashboard';
import { theme } from '@/theme';
import { ProviderAvailabilitySlot, ProviderBooking } from '@/types/providerDashboard';
import { formatDateTime, formatPrice } from '@/utils/format';
import { Button, Card, EmptyState, Loader, Text } from '@/ui';

type AgendaItem =
  | { type: 'booking'; id: string; booking: ProviderBooking }
  | { type: 'slot'; id: string; slot: ProviderAvailabilitySlot };

const centsToPrice = (cents: number): string => formatPrice(cents / 100);

export const ProviderAgendaScreen: React.FC = () => {
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [slots, setSlots] = useState<ProviderAvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAgenda = useCallback(async (): Promise<void> => {
    setErrorMessage(null);
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 30);

    try {
      const [bookingResult, slotResult] = await Promise.all([
        listProviderBookingsRequest({ limit: 50 }),
        listProviderAvailabilityRequest({ from: from.toISOString(), to: to.toISOString() }),
      ]);
      setBookings(bookingResult.bookings);
      setSlots(slotResult);
    } catch {
      setErrorMessage("Impossible de charger l'agenda.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAgenda();
  }, [loadAgenda]);

  const items = useMemo<AgendaItem[]>(() => {
    const bookingItems = bookings.map((booking) => ({
      type: 'booking' as const,
      id: `booking-${booking.id}`,
      booking,
    }));
    const slotItems = slots
      .filter((slot) => !slot.isBooked)
      .map((slot) => ({
        type: 'slot' as const,
        id: `slot-${slot.id}`,
        slot,
      }));

    return [...bookingItems, ...slotItems].sort((a, b) => {
      const aDate = a.type === 'booking' ? a.booking.slotStartAt : a.slot.slotStartAt;
      const bDate = b.type === 'booking' ? b.booking.slotStartAt : b.slot.slotStartAt;
      return aDate.localeCompare(bDate);
    });
  }, [bookings, slots]);

  const onRefresh = (): void => {
    setIsRefreshing(true);
    void loadAgenda();
  };

  const createNextSlot = async (): Promise<void> => {
    setIsCreating(true);
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);

    try {
      await createProviderAvailabilityRequest({
        slotStartAt: start.toISOString(),
        slotEndAt: end.toISOString(),
      });
      await loadAgenda();
    } catch {
      Alert.alert('Créneau non ajouté', 'Le créneau existe peut-être déjà ou la date est invalide.');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteSlot = async (slotId: string): Promise<void> => {
    try {
      await deleteProviderAvailabilityRequest(slotId);
      await loadAgenda();
    } catch {
      Alert.alert('Suppression impossible', 'Ce créneau est peut-être déjà réservé.');
    }
  };

  if (isLoading) {
    return <Loader fullScreen text="Chargement de l'agenda..." />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text variant="heading" size="xl" weight="bold">
          Agenda
        </Text>
        <Button
          title="Ajouter demain 9h"
          size="sm"
          onPress={createNextSlot}
          loading={isCreating}
          disabled={isCreating}
        />
      </View>

      {errorMessage ? (
        <EmptyState title="Agenda indisponible" description={errorMessage} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) =>
            item.type === 'booking' ? (
              <BookingRow booking={item.booking} />
            ) : (
              <SlotRow slot={item.slot} onDelete={() => void deleteSlot(item.slot.id)} />
            )
          }
          ListEmptyComponent={
            <EmptyState
              title="Aucun élément"
              description="Ajoute des disponibilités pour recevoir des réservations."
            />
          }
        />
      )}
    </View>
  );
};

const BookingRow: React.FC<{ booking: ProviderBooking }> = ({ booking }) => {
  const customerName = [booking.customer.firstName, booking.customer.lastName].filter(Boolean).join(' ');

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text size="sm" weight="semibold">
            {formatDateTime(booking.slotStartAt)}
          </Text>
          <Text size="xs" color="secondary">
            {customerName || booking.customer.email || 'Client'} ·{' '}
            {booking.appointmentMode === 'home' ? 'Domicile' : 'Institut'}
          </Text>
          {booking.address ? (
            <Text size="xs" color="secondary">
              {booking.address}
            </Text>
          ) : null}
        </View>
        <View style={styles.amountBlock}>
          <Text size="sm" color="accent" weight="semibold">
            {centsToPrice(booking.amountCents)}
          </Text>
          <Text size="xs" color="secondary">
            {booking.status === 'paid' ? 'Confirmé' : 'Annulé'}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const SlotRow: React.FC<{ slot: ProviderAvailabilitySlot; onDelete: () => void }> = ({
  slot,
  onDelete,
}) => (
  <Card style={styles.card}>
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text size="sm" weight="semibold">
          {formatDateTime(slot.slotStartAt)}
        </Text>
        <Text size="xs" color="secondary">
          Créneau libre
        </Text>
      </View>
      <Button title="Supprimer" variant="outline" size="sm" onPress={onDelete} />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  listContent: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
  card: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  amountBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
});

