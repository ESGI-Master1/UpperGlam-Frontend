import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ANALYTICS_EVENTS, trackEvent, trackScreenView } from '@/analytics';
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
import {
  ProviderCalendar,
  startOfLocalMonth,
  toLocalDateKey,
} from './components/ProviderCalendar';
import { SlotComposerModal } from './components/SlotComposerModal';

type AgendaItem =
  | { type: 'booking'; id: string; booking: ProviderBooking }
  | { type: 'slot'; id: string; slot: ProviderAvailabilitySlot };

const centsToPrice = (cents: number): string => formatPrice(cents / 100);
const formatTime = (isoDate: string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(isoDate))
    .replace(' h ', ':');

export const ProviderAgendaScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => startOfLocalMonth(new Date()));
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [slots, setSlots] = useState<ProviderAvailabilitySlot[]>([]);
  const [rules, setRules] = useState<ProviderAvailabilityRule[]>([]);
  const [closures, setClosures] = useState<ProviderAvailabilityClosure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [isCreatingClosure, setIsCreatingClosure] = useState(false);
  const [isSlotComposerOpen, setIsSlotComposerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [ruleWeekday, setRuleWeekday] = useState('1');
  const [ruleStartTime, setRuleStartTime] = useState('09:00');
  const [ruleEndTime, setRuleEndTime] = useState('18:00');

  const loadAgenda = useCallback(async (): Promise<void> => {
    setErrorMessage(null);
    const from = new Date(calendarMonth);
    from.setDate(from.getDate() - 7);
    from.setHours(0, 0, 0, 0);
    const to = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 2, 7);
    to.setHours(23, 59, 59, 999);

    try {
      const [bookingResult, slotResult] = await Promise.all([
        listProviderBookingsRequest({ limit: 100 }),
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
  }, [calendarMonth]);

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_PROVIDER_AGENDA, 'ProviderAgenda');
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

  const eventCounts = useMemo<Record<string, number>>(() => {
    return items.reduce<Record<string, number>>((counts, item) => {
      const startsAt = item.type === 'booking' ? item.booking.slotStartAt : item.slot.slotStartAt;
      const dateKey = toLocalDateKey(startsAt);
      counts[dateKey] = (counts[dateKey] ?? 0) + 1;
      return counts;
    }, {});
  }, [items]);

  const selectedDateKey = toLocalDateKey(selectedDate);
  const selectedItems = useMemo(() => {
    return items.filter((item) => {
      const startsAt = item.type === 'booking' ? item.booking.slotStartAt : item.slot.slotStartAt;
      return toLocalDateKey(startsAt) === selectedDateKey;
    });
  }, [items, selectedDateKey]);

  const occupiedStartTimes = useMemo(() => {
    return selectedItems.map((item) => {
      const startsAt = item.type === 'booking' ? item.booking.slotStartAt : item.slot.slotStartAt;
      return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
        .format(new Date(startsAt))
        .replace(' h ', ':');
    });
  }, [selectedItems]);

  const selectedDateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(selectedDate);

  const onRefresh = (): void => {
    setIsRefreshing(true);
    void loadAgenda();
  };

  const createSlots = async (
    startTimes: string[],
    durationMinutes: number
  ): Promise<void> => {
    setIsCreating(true);
    let createdCount = 0;

    for (const startTime of startTimes) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const start = new Date(selectedDate);
      start.setHours(hours, minutes, 0, 0);
      const end = new Date(start.getTime() + durationMinutes * 60_000);

      try {
        await createProviderAvailabilityRequest({
          slotStartAt: start.toISOString(),
          slotEndAt: end.toISOString(),
        });
        createdCount += 1;
      } catch {
        // Continue so one duplicate does not prevent the other selected slots.
      }
    }

    try {
      if (createdCount === 0) {
        Alert.alert(
          'Aucun créneau ajouté',
          'Les horaires sont peut-être déjà occupés ou la date est passée.'
        );
        return;
      }

      trackEvent(ANALYTICS_EVENTS.PROVIDER_AVAILABILITY_UPDATED, {
        screen_name: 'ProviderAgenda',
        status: 'success',
        code: 'slots_created',
      });
      await loadAgenda();
      setIsSlotComposerOpen(false);
      if (createdCount < startTimes.length) {
        Alert.alert(
          'Ajout partiel',
          `${createdCount} créneau${createdCount > 1 ? 'x ont' : ' a'} été ajouté${createdCount > 1 ? 's' : ''}. Les autres horaires étaient indisponibles.`
        );
      }
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
      trackEvent(ANALYTICS_EVENTS.PROVIDER_AVAILABILITY_UPDATED, {
        screen_name: 'ProviderAgenda',
        status: 'success',
        code: 'rule_created',
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
      trackEvent(ANALYTICS_EVENTS.PROVIDER_AVAILABILITY_UPDATED, {
        screen_name: 'ProviderAgenda',
        status: 'success',
        code: 'rule_deleted',
      });
      await loadAgenda();
    } catch {
      Alert.alert('Suppression impossible', 'Cette règle horaire est introuvable.');
    }
  };

  const createClosure = async (): Promise<void> => {
    setIsCreatingClosure(true);
    const startsAt = new Date(selectedDate);
    startsAt.setHours(0, 0, 0, 0);
    const endsAt = new Date(startsAt);
    endsAt.setHours(23, 59, 0, 0);

    try {
      await createProviderAvailabilityClosureRequest({
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        reason: 'Fermeture prestataire',
      });
      trackEvent(ANALYTICS_EVENTS.PROVIDER_AVAILABILITY_UPDATED, {
        screen_name: 'ProviderAgenda',
        status: 'success',
        code: 'closure_created',
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
      trackEvent(ANALYTICS_EVENTS.PROVIDER_AVAILABILITY_UPDATED, {
        screen_name: 'ProviderAgenda',
        status: 'success',
        code: 'closure_deleted',
      });
      await loadAgenda();
    } catch {
      Alert.alert('Suppression impossible', 'Cette fermeture est introuvable.');
    }
  };

  const deleteSlot = async (slotId: string): Promise<void> => {
    try {
      await deleteProviderAvailabilityRequest(slotId);
      trackEvent(ANALYTICS_EVENTS.PROVIDER_AVAILABILITY_UPDATED, {
        screen_name: 'ProviderAgenda',
        status: 'success',
        code: 'slot_deleted',
      });
      await loadAgenda();
    } catch {
      Alert.alert('Suppression impossible', 'Ce créneau est peut-être déjà réservé.');
    }
  };

  const acceptBooking = async (bookingId: string): Promise<void> => {
    try {
      await acceptProviderBookingRequest(bookingId);
      trackEvent(ANALYTICS_EVENTS.PROVIDER_BOOKING_ACTION, {
        screen_name: 'ProviderAgenda',
        status: 'success',
        code: 'accepted',
      });
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
      trackEvent(ANALYTICS_EVENTS.PROVIDER_BOOKING_ACTION, {
        screen_name: 'ProviderAgenda',
        status: 'success',
        code: 'rejected',
      });
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
      trackEvent(ANALYTICS_EVENTS.PROVIDER_BOOKING_ACTION, {
        screen_name: 'ProviderAgenda',
        status: 'success',
        code: 'slot_proposed',
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
        <Text size="sm" color="secondary">
          Organise tes rendez-vous et tes disponibilités.
        </Text>
      </View>

      {errorMessage ? (
        <EmptyState title="Agenda indisponible" description={errorMessage} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <ProviderCalendar
            eventCounts={eventCounts}
            month={calendarMonth}
            onMonthChange={(month) => {
              setCalendarMonth(month);
              setSelectedDate(month);
            }}
            onSelectDate={(date) => {
              setSelectedDate(date);
              if (
                date.getMonth() !== calendarMonth.getMonth() ||
                date.getFullYear() !== calendarMonth.getFullYear()
              ) {
                setCalendarMonth(startOfLocalMonth(date));
              }
            }}
            selectedDate={selectedDate}
          />

          <View style={styles.daySection}>
            <View style={styles.dayHeader}>
              <View style={styles.dayHeaderText}>
                <Text size="lg" weight="bold">
                  {selectedDateLabel.charAt(0).toUpperCase() + selectedDateLabel.slice(1)}
                </Text>
                <Text size="xs" color="secondary">
                  {selectedItems.length === 0
                    ? 'Aucun rendez-vous prévu'
                    : `${selectedItems.length} élément${selectedItems.length > 1 ? 's' : ''} dans la journée`}
                </Text>
              </View>
              <Button
                title="+ Créneau"
                size="sm"
                onPress={() => setIsSlotComposerOpen(true)}
              />
            </View>

            {selectedItems.length === 0 ? (
              <Card style={styles.emptyDayCard}>
                <Text size="sm" color="secondary">
                  Cette journée est libre. Ajoute un ou plusieurs créneaux en quelques secondes.
                </Text>
                <Button
                  title="Ajouter des disponibilités"
                  size="sm"
                  variant="outline"
                  onPress={() => setIsSlotComposerOpen(true)}
                />
              </Card>
            ) : (
              <View style={styles.dayItems}>
                {selectedItems.map((item) =>
                  item.type === 'booking' ? (
                    <BookingRow
                      key={item.id}
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
                    <SlotRow
                      key={item.id}
                      slot={item.slot}
                      onDelete={() => void deleteSlot(item.slot.id)}
                    />
                  )
                )}
              </View>
            )}
          </View>

          <View style={styles.settingsTitle}>
            <Text size="lg" weight="bold">
              Réglages de disponibilité
            </Text>
            <Text size="xs" color="secondary">
              Configure les habitudes et les absences exceptionnelles.
            </Text>
          </View>

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
        </ScrollView>
      )}

      <SlotComposerModal
        date={selectedDate}
        isSubmitting={isCreating}
        occupiedStartTimes={occupiedStartTimes}
        onClose={() => {
          if (!isCreating) {
            setIsSlotComposerOpen(false);
          }
        }}
        onSubmit={createSlots}
        visible={isSlotComposerOpen}
      />
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
const weekdayOptions = [
  { value: '1', label: 'L' },
  { value: '2', label: 'M' },
  { value: '3', label: 'M' },
  { value: '4', label: 'J' },
  { value: '5', label: 'V' },
  { value: '6', label: 'S' },
  { value: '0', label: 'D' },
];

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
      <Text size="xs" color="secondary">
        Choisis un jour et une plage horaire habituelle.
      </Text>
      <View style={styles.weekdayPicker}>
        {weekdayOptions.map((option) => {
          const isSelected = ruleWeekday === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setRuleWeekday(option.value)}
              style={[styles.weekdayChip, isSelected && styles.weekdayChipSelected]}
            >
              <Text size="sm" weight={isSelected ? 'bold' : 'regular'}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.ruleForm}>
        <View style={styles.timeField}>
          <Text size="xs" color="secondary">
            Début
          </Text>
          <TextInput
            value={ruleStartTime}
            onChangeText={setRuleStartTime}
            placeholder="09:00"
            style={styles.input}
          />
        </View>
        <View style={styles.timeField}>
          <Text size="xs" color="secondary">
            Fin
          </Text>
          <TextInput
            value={ruleEndTime}
            onChangeText={setRuleEndTime}
            placeholder="18:00"
            style={styles.input}
          />
        </View>
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
              <Button
                title="Supprimer"
                size="sm"
                variant="outline"
                onPress={() => onDeleteRule(rule.id)}
              />
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
          title="Fermer ce jour"
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
            {formatTime(booking.slotStartAt)} – {formatTime(booking.slotEndAt)}
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
          {formatTime(slot.slotStartAt)} – {formatTime(slot.slotEndAt)}
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
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  listContent: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  daySection: {
    gap: theme.spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  dayHeaderText: {
    flex: 1,
    gap: 2,
  },
  dayItems: {
    gap: theme.spacing.sm,
  },
  emptyDayCard: {
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  settingsTitle: {
    gap: 2,
    marginTop: theme.spacing.sm,
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
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  weekdayPicker: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  weekdayChip: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.background,
    backgroundColor: theme.colors.background,
  },
  weekdayChipSelected: {
    borderColor: theme.colors.accentChampagne,
    backgroundColor: '#2A2418',
  },
  timeField: {
    gap: theme.spacing.xs,
  },
  input: {
    minWidth: 92,
    borderWidth: 1,
    borderColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.primaryText,
    backgroundColor: theme.colors.background,
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
