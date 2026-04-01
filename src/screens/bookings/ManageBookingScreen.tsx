import React, { useEffect, useMemo, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { getProviderAvailability, getProviderById } from '@/services/providerService';
import { useBookings } from '@/store';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { AppointmentMode, Provider } from '@/types/provider';
import { Button, Card, Icon, Input, KeyboardScreen, Loader, Text } from '@/ui';
import { formatPrice } from '@/utils/format';

interface DaySlotGroup {
  dayKey: string;
  dayLabel: string;
  dateLabel: string;
  slots: string[];
}

type ManageBookingRoute = RouteProp<RootStackParamList, 'ManageBooking'>;
type ManageBookingNavigation = StackNavigationProp<RootStackParamList, 'ManageBooking'>;

const formatDayLabel = (isoDate: string): string => {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(isoDate));
};

const formatDateLabel = (isoDate: string): string => {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(
    new Date(isoDate)
  );
};

const formatHourLabel = (isoDate: string): string => {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(isoDate)
  );
};

export const ManageBookingScreen: React.FC = () => {
  const route = useRoute<ManageBookingRoute>();
  const navigation = useNavigation<ManageBookingNavigation>();
  const { getBookingById, updateBooking, cancelBooking, isSubmitting } = useBookings();
  const booking = getBookingById(route.params.bookingId);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [providerSlots, setProviderSlots] = useState<string[]>([]);
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedMode, setSelectedMode] = useState<AppointmentMode>('home');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProvider = async (): Promise<void> => {
      if (!booking) {
        return;
      }
      const result = await getProviderById(booking.providerId);
      setProvider(result);
      if (!result) {
        return;
      }

      const from = new Date();
      const to = new Date(from);
      to.setDate(to.getDate() + 30);
      try {
        const availabilitySlots = await getProviderAvailability(
          result.id,
          from.toISOString(),
          to.toISOString()
        );
        setProviderSlots(availabilitySlots.length > 0 ? availabilitySlots : result.nextSlots);
      } catch {
        setProviderSlots(result.nextSlots);
      }
    };

    void loadProvider();
  }, [booking]);

  useEffect(() => {
    if (!booking) {
      return;
    }
    setSelectedSlot(booking.slot);
    setSelectedDayKey(booking.slot.slice(0, 10));
    setSelectedMode(booking.appointmentMode);
    setAddress(booking.address ?? '');
    setNote(booking.note ?? '');
  }, [booking]);

  const groupedSlots = useMemo<DaySlotGroup[]>(() => {
    if (!provider || !booking) {
      return [];
    }

    const allSlots = Array.from(new Set([...providerSlots, booking.slot])).sort();
    const groupedByDay = allSlots.reduce<Record<string, string[]>>((acc, slot) => {
      const dayKey = slot.slice(0, 10);
      acc[dayKey] = acc[dayKey] ? [...acc[dayKey], slot] : [slot];
      return acc;
    }, {});

    return Object.entries(groupedByDay).map(([dayKey, slots]) => {
      const firstSlot = slots[0];
      return {
        dayKey,
        dayLabel: formatDayLabel(firstSlot),
        dateLabel: formatDateLabel(firstSlot),
        slots,
      };
    });
  }, [provider, booking, providerSlots]);

  const availableSlotsForDay = useMemo(() => {
    return groupedSlots.find((group) => group.dayKey === selectedDayKey)?.slots ?? [];
  }, [groupedSlots, selectedDayKey]);

  const canHome = provider?.serviceModes.includes('home') ?? false;
  const canInstitute = provider?.serviceModes.includes('institute') ?? false;

  const submitUpdate = async (): Promise<void> => {
    if (!booking || !selectedSlot) {
      setError('Créneau invalide.');
      return;
    }

    if (selectedMode === 'home' && address.trim().length === 0) {
      setError('Adresse requise pour un rendez-vous à domicile.');
      return;
    }

    setError(null);
    await updateBooking({
      bookingId: booking.id,
      slot: selectedSlot,
      appointmentMode: selectedMode,
      address: selectedMode === 'home' ? address.trim() : undefined,
      note: note.trim() || undefined,
    });
    navigation.goBack();
  };

  const requestCancel = (): void => {
    if (!booking) {
      return;
    }

    Alert.alert(
      'Annuler le rendez-vous',
      'Confirmer l’annulation de ce rendez-vous ?',
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler le rendez-vous',
          style: 'destructive',
          onPress: () => {
            void cancelBooking(booking.id).then(() => navigation.goBack());
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!booking) {
    return (
      <View style={styles.fallback}>
        <Text size="md" color="secondary">
          Rendez-vous introuvable.
        </Text>
      </View>
    );
  }

  if (!provider) {
    return <Loader fullScreen text="Chargement du rendez-vous..." />;
  }

  return (
    <KeyboardScreen contentStyle={styles.content}>
      <Card style={styles.summaryCard}>
        <Text variant="heading" size="lg" weight="bold">
          {provider.name}
        </Text>
        <Text size="sm" color="secondary" style={styles.summaryText}>
          {formatDateLabel(booking.slot)} · {formatHourLabel(booking.slot)}
        </Text>
        <Text size="sm" color="accent">
          {formatPrice(booking.amount)}
        </Text>
      </Card>

      <View style={styles.section}>
        <Text variant="heading" size="lg" weight="bold">
          Type de rendez-vous
        </Text>
        <View style={styles.modeSwitch}>
          {canHome ? (
            <Pressable
              onPress={() => setSelectedMode('home')}
              style={[
                styles.modePill,
                selectedMode === 'home' ? styles.modePillSelected : styles.modePillDefault,
              ]}
            >
              <Icon name="home-map-marker" size={14} color={theme.colors.secondaryText} />
              <Text size="sm" color={selectedMode === 'home' ? 'primary' : 'secondary'}>
                Domicile
              </Text>
            </Pressable>
          ) : null}
          {canInstitute ? (
            <Pressable
              onPress={() => setSelectedMode('institute')}
              style={[
                styles.modePill,
                selectedMode === 'institute' ? styles.modePillSelected : styles.modePillDefault,
              ]}
            >
              <Icon name="storefront-outline" size={14} color={theme.colors.secondaryText} />
              <Text size="sm" color={selectedMode === 'institute' ? 'primary' : 'secondary'}>
                Institut
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="heading" size="lg" weight="bold">
          Choisir une date
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayList}
        >
          {groupedSlots.map((day) => {
            const isSelected = day.dayKey === selectedDayKey;
            return (
              <Pressable
                key={day.dayKey}
                onPress={() => {
                  setSelectedDayKey(day.dayKey);
                  setSelectedSlot(day.slots[0]);
                }}
                style={[
                  styles.dayPill,
                  isSelected ? styles.dayPillSelected : styles.dayPillDefault,
                ]}
              >
                <Text size="xs" color={isSelected ? 'primary' : 'secondary'}>
                  {day.dayLabel}
                </Text>
                <Text size="sm" weight="semibold" color={isSelected ? 'primary' : 'secondary'}>
                  {day.dateLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text variant="heading" size="lg" weight="bold">
          Choisir un horaire
        </Text>
        <View style={styles.timeGrid}>
          {availableSlotsForDay.map((slot) => {
            const isSelected = slot === selectedSlot;
            return (
              <Pressable
                key={slot}
                onPress={() => setSelectedSlot(slot)}
                style={[
                  styles.timePill,
                  isSelected ? styles.timePillSelected : styles.timePillDefault,
                ]}
              >
                <Text size="sm" color={isSelected ? 'primary' : 'secondary'}>
                  {formatHourLabel(slot)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="heading" size="lg" weight="bold">
          Informations
        </Text>
        {selectedMode === 'home' ? (
          <Input
            label="Adresse de prestation"
            value={address}
            onChangeText={setAddress}
            placeholder="12 rue du Glam, Paris"
          />
        ) : (
          <Card style={styles.instituteCard}>
            <View style={styles.instituteRow}>
              <Icon name="map-marker-outline" size={15} color={theme.colors.accentChampagne} />
              <Text size="sm" color="secondary">
                {provider.instituteAddress ?? 'Adresse institut communiquée après confirmation'}
              </Text>
            </View>
          </Card>
        )}
        <Input
          label="Note (optionnelle)"
          value={note}
          onChangeText={setNote}
          placeholder="Interphone, étage, code..."
          style={styles.noteInput}
        />
      </View>

      {error ? (
        <Text size="sm" color="accent">
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Enregistrer les modifications"
          onPress={submitUpdate}
          loading={isSubmitting}
          fullWidth
        />
        <Button
          title="Annuler le rendez-vous"
          variant="outline"
          onPress={requestCancel}
          fullWidth
        />
      </View>
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.lg,
  },
  summaryCard: {
    gap: theme.spacing.xs,
  },
  summaryText: {
    marginTop: theme.spacing.xs,
  },
  section: {
    gap: theme.spacing.sm,
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  modePillDefault: {
    borderColor: theme.colors.secondaryText,
    backgroundColor: theme.colors.surface,
  },
  modePillSelected: {
    borderColor: theme.colors.accentChampagne,
    backgroundColor: theme.colors.accentChampagne,
  },
  dayList: {
    paddingVertical: theme.spacing.xs,
  },
  dayPill: {
    width: 80,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    gap: 2,
  },
  dayPillDefault: {
    borderColor: theme.colors.secondaryText,
    backgroundColor: theme.colors.surface,
  },
  dayPillSelected: {
    borderColor: theme.colors.accentChampagne,
    backgroundColor: theme.colors.accentChampagne,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  timePill: {
    minWidth: 88,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  timePillDefault: {
    borderColor: theme.colors.secondaryText,
    backgroundColor: theme.colors.surface,
  },
  timePillSelected: {
    borderColor: theme.colors.accentChampagne,
    backgroundColor: theme.colors.accentChampagne,
  },
  instituteCard: {
    padding: theme.spacing.md,
  },
  instituteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  noteInput: {
    marginTop: theme.spacing.sm,
  },
  actions: {
    gap: theme.spacing.sm,
  },
  fallback: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
});
