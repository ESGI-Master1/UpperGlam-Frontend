import React, { useEffect, useMemo, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ANALYTICS_EVENTS, trackEvent, trackScreenView } from '@/analytics';
import { getProviderAvailability, getProviderById } from '@/services/providerService';
import { useBookings } from '@/store';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { AppointmentMode, Provider } from '@/types/provider';
import { Button, Card, Icon, Input, KeyboardScreen, Loader, Text } from '@/ui';
import { formatPrice } from '@/utils/format';
import { AUTH_VALIDATION_MESSAGES } from '@/utils/validation';

interface BookingFormValues {
  address: string;
  note: string;
}

interface DaySlotGroup {
  dayKey: string;
  dayLabel: string;
  dateLabel: string;
  slots: string[];
}

type BookingRoute = RouteProp<RootStackParamList, 'Booking'>;
type BookingNavigation = StackNavigationProp<RootStackParamList, 'Booking'>;

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

export const BookingScreen: React.FC = () => {
  const route = useRoute<BookingRoute>();
  const navigation = useNavigation<BookingNavigation>();
  const { createDraft, isSubmitting } = useBookings();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [providerSlots, setProviderSlots] = useState<string[]>([]);
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedMode, setSelectedMode] = useState<AppointmentMode>('home');
  const [screenError, setScreenError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({
    defaultValues: {
      address: '',
      note: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_BOOKING, 'Booking');
    const loadProvider = async (): Promise<void> => {
      const providerResult = await getProviderById(route.params.providerId);
      setProvider(providerResult);
      if (providerResult) {
        setSelectedMode(providerResult.serviceModes.includes('home') ? 'home' : 'institute');
        const from = new Date();
        const to = new Date(from);
        to.setDate(to.getDate() + 30);
        try {
          const availabilitySlots = await getProviderAvailability(
            providerResult.id,
            from.toISOString(),
            to.toISOString()
          );
          setProviderSlots(availabilitySlots.length > 0 ? availabilitySlots : providerResult.nextSlots);
        } catch {
          setProviderSlots(providerResult.nextSlots);
        }
      }
    };
    void loadProvider();
  }, [route.params.providerId]);

  const groupedSlots = useMemo<DaySlotGroup[]>(() => {
    if (!provider) {
      return [];
    }

    const sortedSlots = [...providerSlots].sort();
    const groupedByDay = sortedSlots.reduce<Record<string, string[]>>((acc, slot) => {
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
  }, [provider, providerSlots]);

  useEffect(() => {
    if (groupedSlots.length === 0) {
      return;
    }

    const firstDay = groupedSlots[0];
    const shouldSelectDefaultDay =
      !selectedDayKey || !groupedSlots.some((day) => day.dayKey === selectedDayKey);
    if (shouldSelectDefaultDay) {
      setSelectedDayKey(firstDay.dayKey);
      setSelectedSlot(firstDay.slots[0]);
    }
  }, [groupedSlots, selectedDayKey]);

  const availableSlotsForDay = useMemo(() => {
    return groupedSlots.find((group) => group.dayKey === selectedDayKey)?.slots ?? [];
  }, [groupedSlots, selectedDayKey]);

  const submitBooking = async (values: BookingFormValues): Promise<void> => {
    if (!provider || !selectedSlot) {
      setScreenError(AUTH_VALIDATION_MESSAGES.slotRequired);
      return;
    }

    const resolvedAddress = values.address.trim();
    if (selectedMode === 'home' && !resolvedAddress) {
      setScreenError(AUTH_VALIDATION_MESSAGES.addressRequired);
      return;
    }

    setScreenError(null);
    trackEvent(ANALYTICS_EVENTS.BOOKING_STEP_COMPLETED, {
      screen_name: 'Booking',
      step: 1,
      status: 'success',
    });

    const draft = await createDraft({
      providerId: provider.id,
      slot: selectedSlot,
      appointmentMode: selectedMode,
      address: selectedMode === 'home' ? resolvedAddress : undefined,
      note: values.note.trim() || undefined,
    });

    navigation.navigate('Payment', { draftId: draft.id });
  };

  if (!provider) {
    return <Loader fullScreen text="Chargement de la réservation..." />;
  }

  const canHome = provider.serviceModes.includes('home');
  const canInstitute = provider.serviceModes.includes('institute');

  return (
    <KeyboardScreen contentStyle={styles.content}>
      <Card style={styles.summaryCard}>
        <Image source={{ uri: provider.coverImageUrl }} style={styles.summaryImage} />
        <View style={styles.summaryInfo}>
          <Text variant="heading" size="lg" weight="bold">
            {provider.name}
          </Text>
          <View style={styles.summaryMeta}>
            <Icon name="star" size={14} color={theme.colors.accentChampagne} />
            <Text size="sm" color="secondary">
              {provider.rating.toFixed(1)} · {provider.reviewCount} avis
            </Text>
          </View>
          <Text size="sm" color="accent" weight="semibold">
            Dès {formatPrice(provider.priceFrom)}
          </Text>
        </View>
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
          Informations de lieu
        </Text>
        <View style={styles.form}>
          {selectedMode === 'home' ? (
            <Controller
              control={control}
              name="address"
              rules={{
                validate: (value) => {
                  if (selectedMode !== 'home') {
                    return true;
                  }
                  return value.trim().length > 0 || AUTH_VALIDATION_MESSAGES.addressRequired;
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Adresse de prestation"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="12 rue du Glam, Paris"
                  error={errors.address?.message}
                />
              )}
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

          <Controller
            control={control}
            name="note"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Note (optionnelle)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Interphone, étage, code..."
              />
            )}
          />
        </View>
      </View>

      {screenError ? (
        <Text size="sm" color="accent" style={styles.error}>
          {screenError}
        </Text>
      ) : null}

      <Button
        title={`Continuer · ${formatPrice(provider.priceFrom)}`}
        onPress={handleSubmit(submitBooking)}
        loading={isSubmitting}
        fullWidth
      />
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.lg,
  },
  summaryCard: {
    flexDirection: 'row',
    padding: theme.spacing.md,
  },
  summaryImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
  },
  summaryInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'space-between',
  },
  summaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  form: {
    gap: theme.spacing.md,
  },
  instituteCard: {
    padding: theme.spacing.md,
  },
  instituteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  error: {
    marginBottom: theme.spacing.sm,
  },
});
