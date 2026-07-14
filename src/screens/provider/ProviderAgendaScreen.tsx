import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import {
  acceptProviderBookingRequest,
  createProviderAvailabilityClosureRequest,
  createProviderAvailabilityRequest,
  createProviderAvailabilityRuleRequest,
  deleteProviderAvailabilityClosureRequest,
  deleteProviderAvailabilityRequest,
  deleteProviderAvailabilityRuleRequest,
  listProviderAvailabilityRequest,
  listProviderBookingsRequest,
  proposeProviderBookingSlotRequest,
  rejectProviderBookingRequest,
} from '@/api/providerDashboard';
import { theme } from '@/theme';
import {
  ProviderAvailabilityClosure,
  ProviderAvailabilityRule,
  ProviderAvailabilitySlot,
  ProviderBooking,
} from '@/types/providerDashboard';
import { formatDateTime, formatPrice } from '@/utils/format';
import { Button, Card, EmptyState, Loader, Text } from '@/ui';

type AgendaItem =
  | { type: 'booking'; id: string; booking: ProviderBooking }
  | { type: 'slot'; id: string; slot: ProviderAvailabilitySlot };

const centsToPrice = (cents: number): string => formatPrice(cents / 100);

export const ProviderAgendaScreen: React.FC = () => {
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [slots, setSlots] = useState<ProviderAvailabilitySlot[]>([]);
  const [rules, setRules] = useState<ProviderAvailabilityRule[]>([]);
  const [closures, setClosures] = useState<ProviderAvailabilityClosure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [isCreatingClosure, setIsCreatingClosure] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [ruleWeekday, setRuleWeekday] = useState('1');
  const [ruleStartTime, setRuleStartTime] = useState('09:00');
  const [ruleEndTime, setRuleEndTime] = useState('18:00');

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
      setSlots(slotResult.slots);
      setRules(slotResult.rules);
      setClosures(slotResult.closures);
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
      Alert.alert(
        'Créneau non ajouté',
        'Le créneau existe peut-être déjà ou la date est invalide.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const createRule = async (): Promise<void> => {
    const weekday = Number(ruleWeekday);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      Alert.alert('Jour invalide', 'Utilise un chiffre entre 0 et 6.');
      return;
    }

    setIsCreatingRule(true);
    try {
      await createProviderAvailabilityRuleRequest({
        weekday,
        startTime: ruleStartTime,
        endTime: ruleEndTime,
      });
      await loadAgenda();
    } catch {
      Alert.alert('Règle non ajoutée', "Vérifie l'horaire ou évite les doublons.");
    } finally {
      setIsCreatingRule(false);
    }
  };

  const deleteRule = async (ruleId: string): Promise<void> => {
    try {
      await deleteProviderAvailabilityRuleRequest(ruleId);
      await loadAgenda();
    } catch {
      Alert.alert('Suppression impossible', 'Cette règle horaire est introuvable.');
    }
  };

  const createClosure = async (): Promise<void> => {
    setIsCreatingClosure(true);
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 1);
    startsAt.setHours(0, 0, 0, 0);
    const endsAt = new Date(startsAt);
    endsAt.setHours(23, 59, 0, 0);

    try {
      await createProviderAvailabilityClosureRequest({
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        reason: 'Fermeture prestataire',
      });
      await loadAgenda();
    } catch {
      Alert.alert('Fermeture non ajoutée', 'La période de fermeture est invalide.');
    } finally {
      setIsCreatingClosure(false);
    }
  };

  const deleteClosure = async (closureId: string): Promise<void> => {
    try {
      await deleteProviderAvailabilityClosureRequest(closureId);
      await loadAgenda();
    } catch {
      Alert.alert('Suppression impossible', 'Cette fermeture est introuvable.');
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

  const acceptBooking = async (bookingId: string): Promise<void> => {
    try {
      await acceptProviderBookingRequest(bookingId);
      await loadAgenda();
    } catch {
      Alert.alert('Action impossible', 'Cette réservation a peut-être déjà été traitée.');
    }
  };

  const rejectBooking = async (bookingId: string, reason: string): Promise<void> => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      Alert.alert('Motif requis', 'Le motif de refus est obligatoire.');
      return;
    }

    try {
      await rejectProviderBookingRequest(bookingId, trimmedReason);
      setRejectingBookingId(null);
      setRejectReason('');
      await loadAgenda();
    } catch {
      Alert.alert('Action impossible', 'Cette réservation a peut-être déjà été traitée.');
    }
  };

  const proposeSlot = async (bookingId: string): Promise<void> => {
    const start = new Date();
    start.setDate(start.getDate() + 2);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setHours(11, 0, 0, 0);

    try {
      await proposeProviderBookingSlotRequest(bookingId, {
        slotStartAt: start.toISOString(),
        slotEndAt: end.toISOString(),
        note: 'Nouveau créneau proposé par le prestataire.',
      });
      await loadAgenda();
    } catch {
      Alert.alert('Proposition impossible', 'Le créneau proposé est invalide ou déjà traité.');
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
          ListHeaderComponent={
            <AvailabilitySettings
              closures={closures}
              isCreatingClosure={isCreatingClosure}
              isCreatingRule={isCreatingRule}
              onCreateClosure={() => void createClosure()}
              onCreateRule={() => void createRule()}
              onDeleteClosure={(closureId) => void deleteClosure(closureId)}
              onDeleteRule={(ruleId) => void deleteRule(ruleId)}
              ruleEndTime={ruleEndTime}
              ruleStartTime={ruleStartTime}
              ruleWeekday={ruleWeekday}
              rules={rules}
              setRuleEndTime={setRuleEndTime}
              setRuleStartTime={setRuleStartTime}
              setRuleWeekday={setRuleWeekday}
            />
          }
          renderItem={({ item }) =>
            item.type === 'booking' ? (
              <BookingRow
                booking={item.booking}
                onAccept={() => void acceptBooking(item.booking.id)}
                onProposeSlot={() => void proposeSlot(item.booking.id)}
                onReject={() => {
                  setRejectingBookingId(item.booking.id);
                  setRejectReason('');
                }}
                onRejectCancel={() => {
                  setRejectingBookingId(null);
                  setRejectReason('');
                }}
                onRejectConfirm={() => void rejectBooking(item.booking.id, rejectReason)}
                rejectReason={rejectingBookingId === item.booking.id ? rejectReason : ''}
                rejecting={rejectingBookingId === item.booking.id}
                setRejectReason={setRejectReason}
              />
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

const providerStatusLabel: Record<ProviderBooking['providerStatus'], string> = {
  pending: 'À traiter',
  accepted: 'Accepté',
  rejected: 'Refusé',
  slot_proposed: 'Créneau proposé',
};

const weekdayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const AvailabilitySettings: React.FC<{
  closures: ProviderAvailabilityClosure[];
  isCreatingClosure: boolean;
  isCreatingRule: boolean;
  onCreateClosure: () => void;
  onCreateRule: () => void;
  onDeleteClosure: (closureId: string) => void;
  onDeleteRule: (ruleId: string) => void;
  ruleEndTime: string;
  ruleStartTime: string;
  ruleWeekday: string;
  rules: ProviderAvailabilityRule[];
  setRuleEndTime: (value: string) => void;
  setRuleStartTime: (value: string) => void;
  setRuleWeekday: (value: string) => void;
}> = ({
  closures,
  isCreatingClosure,
  isCreatingRule,
  onCreateClosure,
  onCreateRule,
  onDeleteClosure,
  onDeleteRule,
  ruleEndTime,
  ruleStartTime,
  ruleWeekday,
  rules,
  setRuleEndTime,
  setRuleStartTime,
  setRuleWeekday,
}) => (
  <View style={styles.settings}>
    <Card style={styles.card}>
      <Text size="md" weight="semibold">
        Horaires récurrents
      </Text>
      <View style={styles.ruleForm}>
        <TextInput
          value={ruleWeekday}
          onChangeText={setRuleWeekday}
          keyboardType="number-pad"
          placeholder="Jour 0-6"
          style={[styles.input, styles.dayInput]}
        />
        <TextInput
          value={ruleStartTime}
          onChangeText={setRuleStartTime}
          placeholder="09:00"
          style={styles.input}
        />
        <TextInput
          value={ruleEndTime}
          onChangeText={setRuleEndTime}
          placeholder="18:00"
          style={styles.input}
        />
        <Button
          title="Ajouter"
          size="sm"
          onPress={onCreateRule}
          loading={isCreatingRule}
          disabled={isCreatingRule}
        />
      </View>
      {rules.length === 0 ? (
        <Text size="xs" color="secondary">
          Aucun horaire récurrent configuré.
        </Text>
      ) : (
        <View style={styles.compactList}>
          {rules.map((rule) => (
            <View key={rule.id} style={styles.compactRow}>
              <Text size="xs" color="secondary" style={styles.compactText}>
                {weekdayLabels[rule.weekday] ?? `J${rule.weekday}`} · {rule.startTime}-
                {rule.endTime}
              </Text>
              <Button title="Supprimer" size="sm" variant="outline" onPress={() => onDeleteRule(rule.id)} />
            </View>
          ))}
        </View>
      )}
    </Card>

    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text size="md" weight="semibold">
            Fermetures
          </Text>
          <Text size="xs" color="secondary">
            Exceptions et absences connues
          </Text>
        </View>
        <Button
          title="Fermer demain"
          size="sm"
          variant="outline"
          onPress={onCreateClosure}
          loading={isCreatingClosure}
          disabled={isCreatingClosure}
        />
      </View>
      {closures.length === 0 ? (
        <Text size="xs" color="secondary">
          Aucune fermeture à venir.
        </Text>
      ) : (
        <View style={styles.compactList}>
          {closures.map((closure) => (
            <View key={closure.id} style={styles.compactRow}>
              <Text size="xs" color="secondary" style={styles.compactText}>
                {formatDateTime(closure.startsAt)}
              </Text>
              <Button
                title="Supprimer"
                size="sm"
                variant="outline"
                onPress={() => onDeleteClosure(closure.id)}
              />
            </View>
          ))}
        </View>
      )}
    </Card>
  </View>
);

const BookingRow: React.FC<{
  booking: ProviderBooking;
  onAccept: () => void;
  onProposeSlot: () => void;
  onRejectCancel: () => void;
  onRejectConfirm: () => void;
  onReject: () => void;
  rejectReason: string;
  rejecting: boolean;
  setRejectReason: (value: string) => void;
}> = ({
  booking,
  onAccept,
  onProposeSlot,
  onReject,
  onRejectCancel,
  onRejectConfirm,
  rejecting,
  rejectReason,
  setRejectReason,
}) => {
  const customerName = [booking.customer.firstName, booking.customer.lastName]
    .filter(Boolean)
    .join(' ');
  const canRespond = booking.status === 'paid' && booking.providerStatus === 'pending';

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
            {providerStatusLabel[booking.providerStatus]}
          </Text>
        </View>
      </View>
      {booking.providerResponseNote ? (
        <Text size="xs" color="secondary">
          Note prestataire: {booking.providerResponseNote}
        </Text>
      ) : null}
      {booking.providerProposedSlotStartAt ? (
        <Text size="xs" color="secondary">
          Proposition: {formatDateTime(booking.providerProposedSlotStartAt)}
        </Text>
      ) : null}
      {canRespond ? (
        <View style={styles.actions}>
          <Button title="Accepter" size="sm" onPress={onAccept} />
          <Button title="Proposer" size="sm" variant="outline" onPress={onProposeSlot} />
          <Button title="Refuser" size="sm" variant="outline" onPress={onReject} />
        </View>
      ) : null}
      {rejecting ? (
        <View style={styles.rejectBox}>
          <Text size="xs" color="secondary">
            Motif de refus
          </Text>
          <TextInput
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="Ex: indisponible sur ce créneau"
            multiline
            style={styles.rejectInput}
          />
          <View style={styles.actions}>
            <Button title="Confirmer le refus" size="sm" onPress={onRejectConfirm} />
            <Button title="Annuler" size="sm" variant="outline" onPress={onRejectCancel} />
          </View>
        </View>
      ) : null}
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
  settings: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  card: {
    gap: theme.spacing.sm,
  },
  ruleForm: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  input: {
    minWidth: 78,
    borderWidth: 1,
    borderColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.primaryText,
    backgroundColor: theme.colors.surface,
  },
  dayInput: {
    minWidth: 92,
  },
  compactList: {
    gap: theme.spacing.xs,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  compactText: {
    flex: 1,
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  rejectBox: {
    gap: theme.spacing.sm,
  },
  rejectInput: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.primaryText,
    backgroundColor: theme.colors.surface,
    textAlignVertical: 'top',
  },
});
