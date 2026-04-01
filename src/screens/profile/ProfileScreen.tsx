import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { ANALYTICS_EVENTS, trackEvent, trackScreenView } from '@/analytics';
import { getMeRequest, updateMyPreferencesRequest } from '@/api/users';
import { getLastSearchParams, getRecentInstituteIds, LastSearchParams } from '@/services/localShortcutsService';
import { getProviderById } from '@/services/providerService';
import { useAuth, useBookings } from '@/store';
import { theme } from '@/theme';
import { MainTabParamList, RootStackParamList } from '@/types/navigation';
import { Button, Card, Icon, Text } from '@/ui';

type ProfileNavigation = StackNavigationProp<RootStackParamList, 'Tabs'>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavigation>();
  const { userEmail, logout } = useAuth();
  const { bookings } = useBookings();
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [offersEnabled, setOffersEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [lastSearchParams, setLastSearchParams] = useState<LastSearchParams | null>(null);
  const [recentInstitutes, setRecentInstitutes] = useState<string[]>([]);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_PROFILE, 'Profile');
  }, []);

  useEffect(() => {
    const loadShortcuts = async (): Promise<void> => {
      const [savedSearch, instituteIds] = await Promise.all([
        getLastSearchParams(),
        getRecentInstituteIds(),
      ]);

      const providerResults = await Promise.all(
        instituteIds.map((providerId) => getProviderById(providerId))
      );
      const instituteNames = providerResults
        .map((provider) => provider?.name)
        .filter((name): name is string => Boolean(name));

      setLastSearchParams(savedSearch);
      setRecentInstitutes(instituteNames);
    };

    void loadShortcuts();
  }, []);

  useEffect(() => {
    const loadProfile = async (): Promise<void> => {
      try {
        const profile = await getMeRequest();
        if (!profile.preferences) {
          return;
        }

        setReminderEnabled(profile.preferences.reminderEnabled);
        setOffersEnabled(profile.preferences.offersEnabled);
        setAnalyticsEnabled(profile.preferences.analyticsEnabled);
      } catch {
        // no-op: preferences remain usable offline
      }
    };

    void loadProfile();
  }, []);

  const persistPreferences = useCallback(
    async (nextValues: {
      reminderEnabled: boolean;
      offersEnabled: boolean;
      analyticsEnabled: boolean;
    }): Promise<void> => {
      setIsSavingPreferences(true);
      try {
        await updateMyPreferencesRequest(nextValues);
      } finally {
        setIsSavingPreferences(false);
      }
    },
    []
  );

  const onToggleReminder = (value: boolean): void => {
    setReminderEnabled(value);
    void persistPreferences({
      reminderEnabled: value,
      offersEnabled,
      analyticsEnabled,
    });
  };

  const onToggleOffers = (value: boolean): void => {
    setOffersEnabled(value);
    void persistPreferences({
      reminderEnabled,
      offersEnabled: value,
      analyticsEnabled,
    });
  };

  const onToggleAnalytics = (value: boolean): void => {
    setAnalyticsEnabled(value);
    void persistPreferences({
      reminderEnabled,
      offersEnabled,
      analyticsEnabled: value,
    });
  };

  const initials = useMemo(() => {
    if (!userEmail) {
      return 'UG';
    }
    const localPart = userEmail.split('@')[0] ?? '';
    const chunks = localPart.split(/[._-]/).filter(Boolean);
    if (chunks.length === 0) {
      return localPart.slice(0, 2).toUpperCase();
    }
    return chunks
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('');
  }, [userEmail]);

  const stats = useMemo(() => {
    const now = Date.now();
    const upcoming = bookings.filter((booking) => new Date(booking.slot).getTime() > now).length;
    const visitedInstitutes = new Set(
      bookings
        .filter((booking) => booking.appointmentMode === 'institute')
        .map((booking) => booking.providerId)
    );

    return {
      totalBookings: bookings.length,
      upcomingBookings: upcoming,
      visitedInstitutes: visitedInstitutes.size,
    };
  }, [bookings]);

  const openSearchShortcuts = (): void => {
    navigation.navigate('Tabs', { screen: 'Search' as keyof MainTabParamList });
  };

  const openBookings = (): void => {
    navigation.navigate('Tabs', { screen: 'Bookings' as keyof MainTabParamList });
  };

  const openChangePassword = (): void => {
    trackEvent(ANALYTICS_EVENTS.CTA_CLICK_FORGOT_PASSWORD_START, {
      screen_name: 'Profile',
      cta_name: 'profile_change_password',
      status: 'success',
    });
    navigation.navigate('ForgotPassword', { email: userEmail ?? undefined });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text variant="heading" size="lg" weight="bold">
              {initials}
            </Text>
          </View>
          <View style={styles.heroText}>
            <Text variant="heading" size="xl" weight="bold">
              Mon profil
            </Text>
            <Text size="sm" color="secondary">
              {userEmail ?? 'Compte invité'}
            </Text>
          </View>
          <View style={styles.badge}>
            <Icon name="shield-check-outline" size={14} color={theme.colors.accentChampagne} />
            <Text size="xs" color="accent">
              Compte actif
            </Text>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text size="xs" color="secondary">
              RDV total
            </Text>
            <Text variant="heading" size="xl" weight="bold">
              {stats.totalBookings}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text size="xs" color="secondary">
              À venir
            </Text>
            <Text variant="heading" size="xl" weight="bold">
              {stats.upcomingBookings}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text size="xs" color="secondary">
              Instituts
            </Text>
            <Text variant="heading" size="xl" weight="bold">
              {stats.visitedInstitutes}
            </Text>
          </Card>
        </View>

        <Card style={styles.sectionCard}>
          <Text variant="heading" size="lg" weight="bold">
            Raccourcis
          </Text>
          <Button title="Voir mes rendez-vous" variant="secondary" onPress={openBookings} fullWidth />
          <Button
            title="Ouvrir la recherche"
            variant="tertiary"
            onPress={openSearchShortcuts}
            fullWidth
          />
        </Card>

        <Card style={styles.sectionCard}>
          <Text variant="heading" size="lg" weight="bold">
            Préférences
          </Text>
          <View style={styles.preferenceRow}>
            <Text size="sm">Rappel 24h avant le RDV</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={onToggleReminder}
              trackColor={{ false: theme.colors.secondaryText, true: theme.colors.accentChampagne }}
              thumbColor={theme.colors.primaryText}
              disabled={isSavingPreferences}
            />
          </View>
          <View style={styles.preferenceRow}>
            <Text size="sm">Notifications offres</Text>
            <Switch
              value={offersEnabled}
              onValueChange={onToggleOffers}
              trackColor={{ false: theme.colors.secondaryText, true: theme.colors.accentChampagne }}
              thumbColor={theme.colors.primaryText}
              disabled={isSavingPreferences}
            />
          </View>
          <View style={styles.preferenceRow}>
            <Text size="sm">Partage analytics</Text>
            <Switch
              value={analyticsEnabled}
              onValueChange={onToggleAnalytics}
              trackColor={{ false: theme.colors.secondaryText, true: theme.colors.accentChampagne }}
              thumbColor={theme.colors.primaryText}
              disabled={isSavingPreferences}
            />
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text variant="heading" size="lg" weight="bold">
            Activité récente
          </Text>
          {lastSearchParams ? (
            <View style={styles.activityItem}>
              <Icon name="magnify" size={16} color={theme.colors.accentChampagne} />
              <Text size="sm" color="secondary" style={styles.activityText}>
                Dernière recherche: {lastSearchParams.query || 'sans mot-clé'} · filtres{' '}
                {lastSearchParams.tags.length > 0 ? lastSearchParams.tags.join(', ') : 'aucun'}
              </Text>
            </View>
          ) : (
            <Text size="sm" color="secondary">
              Aucune recherche récente.
            </Text>
          )}
          {recentInstitutes.length > 0 ? (
            <View style={styles.activityList}>
              {recentInstitutes.slice(0, 3).map((instituteName) => (
                <View key={instituteName} style={styles.activityItem}>
                  <Icon
                    name="storefront-outline"
                    size={16}
                    color={theme.colors.accentChampagne}
                  />
                  <Text size="sm" color="secondary" style={styles.activityText}>
                    {instituteName}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text size="sm" color="secondary" style={styles.emptyTopSpacing}>
              Aucun institut visité récemment.
            </Text>
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <Text variant="heading" size="lg" weight="bold">
            Sécurité
          </Text>
          <Text size="sm" color="secondary">
            Session active sur cet appareil.
          </Text>
          <Button
            title="Changer le mot de passe"
            variant="secondary"
            onPress={openChangePassword}
            fullWidth
          />
          <Button title="Se déconnecter" variant="outline" onPress={logout} fullWidth />
        </Card>
      </ScrollView>
    </View>
  );
};

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
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.28)',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentChampagne,
  },
  heroText: {
    gap: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(214, 179, 106, 0.12)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  sectionCard: {
    gap: theme.spacing.sm,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  activityList: {
    gap: theme.spacing.xs,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  activityText: {
    flex: 1,
  },
  emptyTopSpacing: {
    marginTop: theme.spacing.xs,
  },
});
