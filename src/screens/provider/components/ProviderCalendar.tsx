import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { theme } from '@/theme';
import { Card, Text } from '@/ui';

const weekdayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const toLocalDateKey = (value: Date | string): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const startOfLocalMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const buildCalendarDays = (month: Date): Date[] => {
  const firstDay = startOfLocalMonth(month);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(calendarStart.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
};

interface ProviderCalendarProps {
  eventCounts: Record<string, number>;
  month: Date;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

export const ProviderCalendar: React.FC<ProviderCalendarProps> = ({
  eventCounts,
  month,
  onMonthChange,
  onSelectDate,
  selectedDate,
}) => {
  const days = useMemo(() => buildCalendarDays(month), [month]);
  const selectedKey = toLocalDateKey(selectedDate);
  const todayKey = toLocalDateKey(new Date());
  const monthLabel = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(month);

  const changeMonth = (offset: number): void => {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    onMonthChange(nextMonth);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.monthHeader}>
        <Pressable
          accessibilityLabel="Mois précédent"
          hitSlop={12}
          onPress={() => changeMonth(-1)}
          style={styles.monthButton}
        >
          <Text size="xl" color="accent">
            ‹
          </Text>
        </Pressable>
        <Text size="lg" weight="bold" style={styles.monthLabel}>
          {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
        </Text>
        <Pressable
          accessibilityLabel="Mois suivant"
          hitSlop={12}
          onPress={() => changeMonth(1)}
          style={styles.monthButton}
        >
          <Text size="xl" color="accent">
            ›
          </Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {weekdayLabels.map((label, index) => (
          <View key={`${label}-${index}`} style={styles.weekCell}>
            <Text size="xs" color="secondary" weight="semibold">
              {label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((date) => {
          const dateKey = toLocalDateKey(date);
          const isSelected = dateKey === selectedKey;
          const isToday = dateKey === todayKey;
          const isCurrentMonth = date.getMonth() === month.getMonth();
          const eventCount = eventCounts[dateKey] ?? 0;

          return (
            <Pressable
              key={dateKey}
              accessibilityLabel={`${date.getDate()} ${monthLabel}`}
              onPress={() => onSelectDate(date)}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isToday && !isSelected && styles.dayCellToday,
              ]}
            >
              <Text
                size="sm"
                color={isCurrentMonth || isSelected ? 'primary' : 'secondary'}
                weight={isSelected || isToday ? 'bold' : 'regular'}
              >
                {date.getDate()}
              </Text>
              {eventCount > 0 ? (
                <View style={[styles.eventDot, isSelected && styles.eventDotSelected]}>
                  <Text size="xs" weight="bold">
                    {eventCount > 9 ? '9+' : eventCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendDot} />
        <Text size="xs" color="secondary">
          Rendez-vous ou disponibilité
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.background,
  },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 2,
  },
  dayCellSelected: {
    backgroundColor: theme.colors.accentChampagne,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: theme.colors.accentChampagne,
  },
  eventDot: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentChampagne,
  },
  eventDotSelected: {
    backgroundColor: theme.colors.background,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.accentChampagne,
  },
});
