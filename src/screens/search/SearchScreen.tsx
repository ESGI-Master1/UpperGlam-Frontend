import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ANALYTICS_EVENTS, trackEvent, trackScreenView } from '@/analytics';
import { ProviderCard, TagChip } from '@/components';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { saveLastSearchParams } from '@/services/localShortcutsService';
import { getProviderTags, searchProviders } from '@/services/providerService';
import { theme } from '@/theme';
import { MainTabParamList, RootStackParamList } from '@/types/navigation';
import { Provider, ProviderTag } from '@/types/provider';
import { EmptyState, Input, Loader, Text } from '@/ui';

type SearchRoute = RouteProp<MainTabParamList, 'Search'>;
type SearchNavigation = StackNavigationProp<RootStackParamList, 'Tabs'>;

export const SearchScreen: React.FC = () => {
  const route = useRoute<SearchRoute>();
  const navigation = useNavigation<SearchNavigation>();
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<ProviderTag[]>([]);
  const [searchLocation, setSearchLocation] = useState<string | undefined>(undefined);
  const [searchDate, setSearchDate] = useState<string | undefined>(undefined);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [availableTags, setAvailableTags] = useState<ProviderTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedInitialResults, setHasLoadedInitialResults] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_SEARCH, 'Search');
  }, []);

  useEffect(() => {
    const loadTags = async (): Promise<void> => {
      setIsLoadingTags(true);
      try {
        const tags = await getProviderTags();
        setAvailableTags(tags);
      } finally {
        setIsLoadingTags(false);
      }
    };

    void loadTags();
  }, []);

  useEffect(() => {
    if (!route.params) {
      return;
    }

    if (typeof route.params.initialQuery === 'string') {
      setQuery(route.params.initialQuery);
    }

    if (Array.isArray(route.params.initialTags) && route.params.initialTags.length > 0) {
      setSelectedTags(route.params.initialTags);
    } else if (route.params.initialTag) {
      setSelectedTags([route.params.initialTag]);
    }

    if (typeof route.params.initialLocation === 'string') {
      setSearchLocation(route.params.initialLocation);
    }

    if (typeof route.params.initialDate === 'string') {
      setSearchDate(route.params.initialDate);
    }
  }, [
    route.params?.initialTag,
    route.params?.initialQuery,
    route.params?.initialLocation,
    route.params?.initialDate,
    route.params?.initialTags,
  ]);

  useEffect(() => {
    const runSearch = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const result = await searchProviders({
          query: debouncedQuery,
          tags: selectedTags,
          location: searchLocation,
          date: searchDate,
        });
        setProviders(result);
      } finally {
        setIsLoading(false);
        setHasLoadedInitialResults(true);
      }
    };

    void runSearch();
  }, [debouncedQuery, selectedTags, searchLocation, searchDate]);

  useEffect(() => {
    if (!isLoading && providers.length === 0) {
      trackEvent(ANALYTICS_EVENTS.EMPTY_STATE_VIEWED, {
        screen_name: 'Search',
        status: 'success',
      });
    }
  }, [isLoading, providers.length]);

  useEffect(() => {
    const persistSearchParams = async (): Promise<void> => {
      await saveLastSearchParams({
        query: debouncedQuery,
        tags: selectedTags,
        location: searchLocation,
        date: searchDate,
      });
    };

    void persistSearchParams();
  }, [debouncedQuery, selectedTags, searchLocation, searchDate]);

  const toggleTag = useCallback((tag: ProviderTag): void => {
    setSelectedTags((current) => {
      const exists = current.includes(tag);
      const nextTags = exists ? current.filter((item) => item !== tag) : [...current, tag];

      trackEvent(ANALYTICS_EVENTS.CTA_CLICK_SEARCH_TAG, {
        screen_name: 'Search',
        cta_name: `search_tag_${tag}`,
      });

      return nextTags;
    });
  }, []);

  const openProvider = (providerId: string): void => {
    trackEvent(ANALYTICS_EVENTS.CTA_CLICK_PROVIDER_CARD, {
      screen_name: 'Search',
      cta_name: providerId,
    });
    navigation.navigate('ProviderDetails', { providerId });
  };

  if (isLoadingTags || (!hasLoadedInitialResults && isLoading)) {
    return <Loader fullScreen text="Recherche en cours..." />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.searchBlock}>
        <Text variant="heading" size="xl" weight="bold">
          Recherche
        </Text>
        <Input
          placeholder="Coiffure, makeup, Paris..."
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        <View style={styles.tags}>
          {availableTags.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              selected={selectedTags.includes(tag)}
              onPress={toggleTag}
            />
          ))}
        </View>
        {isLoading ? <Loader size="small" text="Mise à jour des résultats..." /> : null}
      </View>

      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ProviderCard provider={item} onPress={openProvider} />}
        ListEmptyComponent={
          <EmptyState
            title="Aucun prestataire trouvé"
            description="Essaie avec un autre tag ou élargis ta recherche."
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
  },
  searchBlock: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  searchInput: {
    marginTop: theme.spacing.md,
  },
  tags: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
});
