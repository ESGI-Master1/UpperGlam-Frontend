import React, { useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ANALYTICS_EVENTS, trackScreenView } from '@/analytics';
import { BookingCard } from '@/components';
import { useBookings } from '@/store';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { EmptyState, Text } from '@/ui';

type BookingsNavigation = StackNavigationProp<RootStackParamList, 'Tabs'>;

export const BookingsScreen: React.FC = () => {
  const navigation = useNavigation<BookingsNavigation>();
  const { bookings, providerNameById, refreshBookings } = useBookings();
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => (a.slot > b.slot ? -1 : 1));
  }, [bookings]);

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_BOOKINGS, 'Bookings');
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void refreshBookings();
    }, [refreshBookings])
  );

  return (
    <View style={styles.screen}>
      <Text variant="heading" size="xl" weight="bold" style={styles.title}>
        Mes rendez-vous
      </Text>
      <FlatList
        data={sortedBookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            providerName={providerNameById[item.providerId] ?? 'Prestataire'}
            onPress={() => navigation.navigate('ManageBooking', { bookingId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Aucun rendez-vous"
            description="Tes réservations validées apparaîtront ici."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.md,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
});
