import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { theme } from '@/theme';
import { Button, Text } from '@/ui';
import { toLocalDateKey } from './ProviderCalendar';

const startTimeOptions = Array.from({ length: 11 }, (_, index) => {
  return `${String(index + 8).padStart(2, '0')}:00`;
});

const durationOptions = [30, 60, 90, 120];

const dateAtTime = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

interface SlotComposerModalProps {
  date: Date;
  isSubmitting: boolean;
  occupiedStartTimes: string[];
  onClose: () => void;
  onSubmit: (startTimes: string[], durationMinutes: number) => Promise<void>;
  visible: boolean;
}

export const SlotComposerModal: React.FC<SlotComposerModalProps> = ({
  date,
  isSubmitting,
  occupiedStartTimes,
  onClose,
  onSubmit,
  visible,
}) => {
  const [selectedStartTimes, setSelectedStartTimes] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const occupiedTimes = useMemo(() => new Set(occupiedStartTimes), [occupiedStartTimes]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const firstAvailableTime = startTimeOptions.find((time) => {
      return !occupiedTimes.has(time) && dateAtTime(date, time).getTime() > Date.now();
    });
    setSelectedStartTimes(firstAvailableTime ? [firstAvailableTime] : []);
    setDurationMinutes(60);
  }, [date, occupiedTimes, visible]);

  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

  const toggleStartTime = (time: string): void => {
    setSelectedStartTimes((current) =>
      current.includes(time)
        ? current.filter((selectedTime) => selectedTime !== time)
        : [...current, time].sort()
    );
  };

  const submit = async (): Promise<void> => {
    if (selectedStartTimes.length === 0) {
      return;
    }
    await onSubmit(selectedStartTimes, durationMinutes);
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="heading" size="xl" weight="bold">
              Ajouter des créneaux
            </Text>
            <Text size="sm" color="secondary">
              {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
            </Text>
          </View>
          <Pressable accessibilityLabel="Fermer" hitSlop={12} onPress={onClose}>
            <Text size="xl" color="accent">
              ×
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text size="md" weight="semibold">
              1. Choisis une durée
            </Text>
            <View style={styles.chipGrid}>
              {durationOptions.map((duration) => {
                const isSelected = durationMinutes === duration;
                const label =
                  duration < 60
                    ? `${duration} min`
                    : duration % 60 === 0
                      ? `${duration / 60} h`
                      : `${Math.floor(duration / 60)} h 30`;
                return (
                  <Pressable
                    key={duration}
                    onPress={() => setDurationMinutes(duration)}
                    style={[styles.durationChip, isSelected && styles.chipSelected]}
                  >
                    <Text size="sm" weight={isSelected ? 'bold' : 'regular'}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View>
              <Text size="md" weight="semibold">
                2. Sélectionne les heures
              </Text>
              <Text size="xs" color="secondary">
                Tu peux en sélectionner plusieurs en une seule fois.
              </Text>
            </View>
            <View style={styles.timeGrid}>
              {startTimeOptions.map((time) => {
                const isOccupied = occupiedTimes.has(time);
                const isPast = dateAtTime(date, time).getTime() <= Date.now();
                const isDisabled = isOccupied || isPast;
                const isSelected = selectedStartTimes.includes(time);
                return (
                  <Pressable
                    key={`${toLocalDateKey(date)}-${time}`}
                    disabled={isDisabled}
                    onPress={() => toggleStartTime(time)}
                    style={[
                      styles.timeChip,
                      isSelected && styles.chipSelected,
                      isDisabled && styles.chipDisabled,
                    ]}
                  >
                    <Text size="sm" weight={isSelected ? 'bold' : 'regular'}>
                      {time}
                    </Text>
                    {isOccupied ? (
                      <Text size="xs" color="secondary">
                        Occupé
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.summary}>
            <Text size="sm" color="secondary">
              {selectedStartTimes.length === 0
                ? 'Sélectionne au moins une heure disponible.'
                : `${selectedStartTimes.length} créneau${selectedStartTimes.length > 1 ? 'x' : ''} sélectionné${selectedStartTimes.length > 1 ? 's' : ''}`}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={
              selectedStartTimes.length === 0
                ? 'Ajouter des créneaux'
                : `Ajouter ${selectedStartTimes.length} créneau${selectedStartTimes.length > 1 ? 'x' : ''}`
            }
            disabled={selectedStartTimes.length === 0 || isSubmitting}
            loading={isSubmitting}
            onPress={() => void submit()}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  headerText: {
    gap: theme.spacing.xs,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  section: {
    gap: theme.spacing.md,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  durationChip: {
    minWidth: 72,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  timeChip: {
    width: '31%',
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },
  chipSelected: {
    borderColor: theme.colors.accentChampagne,
    backgroundColor: '#2A2418',
  },
  chipDisabled: {
    opacity: 0.35,
  },
  summary: {
    padding: theme.spacing.md,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
  },
});
