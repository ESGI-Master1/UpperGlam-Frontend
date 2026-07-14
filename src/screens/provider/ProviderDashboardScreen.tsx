import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { getProviderDashboardRequest, getProviderRevenueRequest } from '@/api/providerDashboard';
import { theme } from '@/theme';
import { ProviderDashboard, ProviderRevenue } from '@/types/providerDashboard';
import { formatDateTime, formatPrice } from '@/utils/format';
import { Card, EmptyState, Loader, Text } from '@/ui';

const centsToPrice = (cents: number): string => formatPrice(cents / 100);

export const ProviderDashboardScreen: React.FC = () => {
  const [dashboard, setDashboard] = useState<ProviderDashboard | null>(null);
  const [revenue, setRevenue] = useState<ProviderRevenue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    setErrorMessage(null);
    try {
      const [dashboardResult, revenueResult] = await Promise.all([
        getProviderDashboardRequest(),
        getProviderRevenueRequest(),
      ]);
      setDashboard(dashboardResult);
      setRevenue(revenueResult);
    } catch {
      setErrorMessage("Impossible de charger l'activité prestataire.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const onRefresh = (): void => {
    setIsRefreshing(true);
    void loadDashboard();
  };

  if (isLoading) {
    return <Loader fullScreen text="Chargement de l'activité..." />;
  }

  if (errorMessage || !dashboard) {
    return (
      <EmptyState
        title="Espace prestataire indisponible"
        description={errorMessage ?? 'Aucune donnée prestataire.'}
        actionLabel="Réessayer"
        onAction={() => {
          setIsLoading(true);
          void loadDashboard();
        }}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <Card style={styles.heroCard}>
          <Text variant="heading" size="xl" weight="bold">
            {dashboard.provider.displayName}
          </Text>
          <Text size="sm" color="secondary">
            {dashboard.provider.city} · {dashboard.provider.rating.toFixed(1)} / 5 ·{' '}
            {dashboard.provider.reviewCount} avis
          </Text>
        </Card>

        <View style={styles.grid}>
          <StatCard label="RDV à venir" value={String(dashboard.stats.upcomingBookings)} />
          <StatCard label="CA du mois" value={centsToPrice(dashboard.stats.monthRevenueCents)} />
          <StatCard label="Créneaux libres" value={String(dashboard.stats.openSlots)} />
          <StatCard label="Annulations" value={String(dashboard.stats.cancelledBookings)} />
        </View>

        <Card style={styles.sectionCard}>
          <Text variant="heading" size="lg" weight="bold">
            Prochains rendez-vous
          </Text>
          {dashboard.nextBookings.length > 0 ? (
            dashboard.nextBookings.map((booking) => (
              <View key={booking.id} style={styles.row}>
                <View style={styles.rowText}>
                  <Text size="sm" weight="semibold">
                    {formatDateTime(booking.slot)}
                  </Text>
                  <Text size="xs" color="secondary">
                    {booking.appointmentMode === 'home' ? 'Domicile' : 'Institut'}
                  </Text>
                </View>
                <Text size="sm" color="accent">
                  {centsToPrice(booking.amountCents)}
                </Text>
              </View>
            ))
          ) : (
            <Text size="sm" color="secondary">
              Aucun rendez-vous à venir.
            </Text>
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <Text variant="heading" size="lg" weight="bold">
            Revenus
          </Text>
          <View style={styles.row}>
            <Text size="sm" color="secondary">
              Mois en cours
            </Text>
            <Text size="sm" weight="semibold">
              {centsToPrice(revenue?.month.amountCents ?? 0)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text size="sm" color="secondary">
              Année en cours
            </Text>
            <Text size="sm" weight="semibold">
              {centsToPrice(revenue?.year.amountCents ?? 0)}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Card style={styles.statCard}>
    <Text size="xs" color="secondary">
      {label}
    </Text>
    <Text variant="heading" size="xl" weight="bold">
      {value}
    </Text>
  </Card>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  heroCard: {
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.28)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statCard: {
    width: '48%',
    minHeight: 96,
    gap: theme.spacing.xs,
  },
  sectionCard: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
