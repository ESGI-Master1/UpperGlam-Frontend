import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ANALYTICS_EVENTS, trackScreenView } from '@/analytics';
import {
  exportProviderCsvRequest,
  getProviderRevenueRequest,
  listProviderCustomersRequest,
  updateProviderCustomerNoteRequest,
} from '@/api/providerDashboard';
import { theme } from '@/theme';
import { ProviderCustomer, ProviderRevenue } from '@/types/providerDashboard';
import { Button, Card, EmptyState, Loader, Text } from '@/ui';
import { formatDateTime, formatPrice } from '@/utils/format';

const centsToPrice = (cents: number): string => formatPrice(cents / 100);

export const ProviderOperationsScreen: React.FC = () => {
  const [customers, setCustomers] = useState<ProviderCustomer[]>([]);
  const [revenue, setRevenue] = useState<ProviderRevenue | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOperations = useCallback(async (): Promise<void> => {
    setErrorMessage(null);
    try {
      const [customerResult, revenueResult] = await Promise.all([
        listProviderCustomersRequest(),
        getProviderRevenueRequest(),
      ]);
      setCustomers(customerResult);
      setRevenue(revenueResult);
      setNotes(
        Object.fromEntries(
          customerResult.map((customer) => [String(customer.customerUserId), customer.note ?? ''])
        )
      );
    } catch {
      setErrorMessage("Impossible de charger les opérations prestataire.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_PROVIDER_OPERATIONS, 'ProviderOperations');
    void loadOperations();
  }, [loadOperations]);

  const saveNote = async (customerUserId: string): Promise<void> => {
    try {
      await updateProviderCustomerNoteRequest(customerUserId, notes[customerUserId] ?? null);
      await loadOperations();
    } catch {
      Alert.alert('Note non enregistrée', 'Le client est peut-être introuvable.');
    }
  };

  const exportCsv = async (type: 'bookings' | 'transactions'): Promise<void> => {
    try {
      const csv = await exportProviderCsvRequest(type);
      Alert.alert('Export prêt', `${csv.split('\n').length - 1} lignes exportées.`);
    } catch {
      Alert.alert('Export impossible', "Le fichier CSV n'a pas pu être généré.");
    }
  };

  if (isLoading) {
    return <Loader fullScreen text="Chargement des opérations..." />;
  }

  if (errorMessage) {
    return (
      <EmptyState
        title="Opérations indisponibles"
        description={errorMessage}
        actionLabel="Réessayer"
        onAction={() => {
          setIsLoading(true);
          void loadOperations();
        }}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadOperations();
            }}
          />
        }
      >
        <Card style={styles.card}>
          <Text variant="heading" size="lg" weight="bold">
            Revenus & payouts
          </Text>
          <MetricRow label="Mois en cours" value={centsToPrice(revenue?.month.amountCents ?? 0)} />
          <MetricRow label="Année en cours" value={centsToPrice(revenue?.year.amountCents ?? 0)} />
          <MetricRow
            label="Reversement en attente"
            value={centsToPrice(revenue?.payouts?.pendingCents ?? 0)}
          />
          <Text size="xs" color="secondary">
            Statut payouts: {revenue?.payouts?.status ?? 'manual_review'}
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text variant="heading" size="lg" weight="bold">
            Exports
          </Text>
          <View style={styles.actions}>
            <Button title="RDV CSV" size="sm" onPress={() => void exportCsv('bookings')} />
            <Button
              title="Transactions CSV"
              size="sm"
              variant="outline"
              onPress={() => void exportCsv('transactions')}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text variant="heading" size="lg" weight="bold">
            Transactions récentes
          </Text>
          {revenue?.transactions.length ? (
            revenue.transactions.map((transaction) => (
              <View key={transaction.bookingId} style={styles.row}>
                <View style={styles.rowText}>
                  <Text size="sm" weight="semibold">
                    {formatDateTime(transaction.slot)}
                  </Text>
                  <Text size="xs" color="secondary">
                    #{transaction.bookingId} · {transaction.status}
                  </Text>
                </View>
                <Text size="sm" color="accent">
                  {centsToPrice(transaction.amountCents)}
                </Text>
              </View>
            ))
          ) : (
            <Text size="sm" color="secondary">
              Aucune transaction.
            </Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text variant="heading" size="lg" weight="bold">
            Clients
          </Text>
          {customers.length === 0 ? (
            <Text size="sm" color="secondary">
              Aucun client pour le moment.
            </Text>
          ) : (
            customers.map((customer) => {
              const customerId = String(customer.customerUserId);
              const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ');
              return (
                <View key={customerId} style={styles.customerBlock}>
                  <View style={styles.row}>
                    <View style={styles.rowText}>
                      <Text size="sm" weight="semibold">
                        {name || customer.email}
                      </Text>
                      <Text size="xs" color="secondary">
                        {customer.bookingCount} RDV · {centsToPrice(customer.totalAmountCents)}
                      </Text>
                      {customer.lastBookingAt ? (
                        <Text size="xs" color="secondary">
                          Dernier RDV: {formatDateTime(customer.lastBookingAt)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <TextInput
                    value={notes[customerId] ?? ''}
                    onChangeText={(value) => setNotes((current) => ({ ...current, [customerId]: value }))}
                    placeholder="Note interne"
                    multiline
                    style={styles.noteInput}
                  />
                  <Button title="Enregistrer la note" size="sm" onPress={() => void saveNote(customerId)} />
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </View>
  );
};

const MetricRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text size="sm" color="secondary">
      {label}
    </Text>
    <Text size="sm" weight="semibold">
      {value}
    </Text>
  </View>
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
  card: {
    gap: theme.spacing.md,
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  customerBlock: {
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
    paddingTop: theme.spacing.sm,
  },
  noteInput: {
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
