import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ANALYTICS_EVENTS, trackEvent, trackScreenView } from '@/analytics';
import { ProviderCard } from '@/components';
import {
  getLastSearchParams,
  getRecentInstituteIds,
  LastSearchParams,
} from '@/services/localShortcutsService';
import { getFeaturedProviders, getProviderById } from '@/services/providerService';
import { theme } from '@/theme';
import { Provider } from '@/types/provider';
import { RootStackParamList } from '@/types/navigation';
import { Button, Icon, Loader, Text } from '@/ui';

type HomeNavigation = StackNavigationProp<RootStackParamList, 'Tabs'>;

const formatSearchUpdatedAt = (isoDate: string): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigation>();
  const [isLoading, setIsLoading] = useState(true);
  const [featuredProviders, setFeaturedProviders] = useState<Provider[]>([]);
  const [recentInstituteProviders, setRecentInstituteProviders] = useState<Provider[]>([]);
  const [lastSearchParams, setLastSearchParams] = useState<LastSearchParams | null>(null);

  const loadHomeShortcuts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const [providers, recentInstituteIds, savedSearchParams] = await Promise.all([
        getFeaturedProviders(),
        getRecentInstituteIds(),
        getLastSearchParams(),
      ]);

      setFeaturedProviders(providers);
      setLastSearchParams(savedSearchParams);

      if (recentInstituteIds.length === 0) {
        setRecentInstituteProviders([]);
        return;
      }

      const recentProviders = await Promise.all(
        recentInstituteIds.map((providerId) => getProviderById(providerId))
      );
      setRecentInstituteProviders(
        recentProviders.filter((provider): provider is Provider => Boolean(provider))
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_HOME, 'Home');
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHomeShortcuts();
    }, [loadHomeShortcuts])
  );

  const openProvider = (providerId: string): void => {
    trackEvent(ANALYTICS_EVENTS.CTA_CLICK_PROVIDER_CARD, {
      screen_name: 'Home',
      cta_name: providerId,
    });
    navigation.navigate('ProviderDetails', { providerId });
  };

  const launchLastSearch = (): void => {
    if (!lastSearchParams) {
      return;
    }

    trackEvent(ANALYTICS_EVENTS.CTA_CLICK_SEARCH_TAG, {
      screen_name: 'Home',
      cta_name: 'home_last_search',
    });

    navigation.navigate('Tabs', {
      screen: 'Search',
      params: {
        initialQuery: lastSearchParams.query,
        initialTags: lastSearchParams.tags,
        initialLocation: lastSearchParams.location,
        initialDate: lastSearchParams.date,
      },
    });
  };

  const homeProviders = useMemo(() => {
    return recentInstituteProviders.length > 0 ? recentInstituteProviders : featuredProviders;
  }, [recentInstituteProviders, featuredProviders]);

  const sectionTitle =
    recentInstituteProviders.length > 0 ? 'Tes instituts habituels' : 'Suggestions pour toi';

  if (isLoading) {
    return <Loader fullScreen text="Chargement des prestataires..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Icon name="history" color={theme.colors.accentChampagne} size={24} />
          <Text variant="heading" size="xl" weight="bold">
            Tes raccourcis beauté
          </Text>
        </View>
        <Text size="sm" color="secondary" style={styles.subtitle}>
          Retrouve vite tes habitudes et relance tes recherches en un geste.
        </Text>

        {lastSearchParams ? (
          <View style={styles.searchShortcutCard}>
            <Text variant="heading" size="lg" weight="bold">
              Derniers paramètres de recherche
            </Text>
            {lastSearchParams.query ? (
              <Text size="sm" color="secondary">
                Lieu / mot-clé : {lastSearchParams.query}
              </Text>
            ) : null}
            {lastSearchParams.location ? (
              <Text size="sm" color="secondary">
                Zone : {lastSearchParams.location}
              </Text>
            ) : null}
            {lastSearchParams.date ? (
              <Text size="sm" color="secondary">
                Date : {lastSearchParams.date}
              </Text>
            ) : null}
            {lastSearchParams.tags.length > 0 ? (
              <Text size="sm" color="secondary">
                Filtres : {lastSearchParams.tags.join(' • ')}
              </Text>
            ) : null}
            <Text size="xs" color="secondary">
              Mis à jour le {formatSearchUpdatedAt(lastSearchParams.updatedAt)}
            </Text>
            <View style={styles.searchShortcutButton}>
              <Button
                title="Relancer cette recherche"
                variant="tertiary"
                onPress={launchLastSearch}
                fullWidth
              />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text variant="heading" size="lg" weight="bold">
            {sectionTitle}
          </Text>
          {recentInstituteProviders.length === 0 ? (
            <Text size="sm" color="secondary" style={styles.sectionHint}>
              Pas encore d&apos;institut fréquenté: voici des suggestions.
            </Text>
          ) : null}
          <View style={styles.cards}>
            {homeProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} onPress={openProvider} />
            ))}
          </View>
        </View>
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
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
  },
  searchShortcutCard: {
    marginTop: theme.spacing.lg,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  searchShortcutButton: {
    marginTop: theme.spacing.sm,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionHint: {
    marginTop: theme.spacing.xs,
  },
  cards: {
    marginTop: theme.spacing.md,
  },
});
