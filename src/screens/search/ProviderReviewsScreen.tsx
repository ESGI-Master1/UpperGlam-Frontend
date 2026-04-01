import React, { useEffect, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { getProviderById, getProviderReviews } from '@/services/providerService';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { Provider, ProviderReview, ReviewRating } from '@/types/provider';
import { Icon, Loader, Text } from '@/ui';

type ProviderReviewsRoute = RouteProp<RootStackParamList, 'ProviderReviews'>;
type RatingFilter = 'all' | ReviewRating;
type AgeSort = 'newest' | 'oldest';
const STAR_FILTERS: ReviewRating[] = [1, 2, 3, 4, 5];

const formatReviewDate = (isoDate: string): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
};

export const ProviderReviewsScreen: React.FC = () => {
  const route = useRoute<ProviderReviewsRoute>();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<ProviderReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [ageSort, setAgeSort] = useState<AgeSort>('newest');

  useEffect(() => {
    const loadProvider = async (): Promise<void> => {
      setIsLoading(true);
      const providerResult = await getProviderById(route.params.providerId);
      setProvider(providerResult);
      setIsLoading(false);
    };

    void loadProvider();
  }, [route.params.providerId]);

  useEffect(() => {
    const loadReviews = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const result = await getProviderReviews(route.params.providerId, {
          rating: ratingFilter === 'all' ? undefined : ratingFilter,
          sortOrder: ageSort === 'newest' ? 'desc' : 'asc',
        });
        setReviews(result);
      } finally {
        setIsLoading(false);
      }
    };

    void loadReviews();
  }, [route.params.providerId, ratingFilter, ageSort]);

  if (isLoading) {
    return <Loader fullScreen text="Chargement des avis..." />;
  }

  if (!provider) {
    return (
      <View style={styles.fallback}>
        <Text size="md" color="secondary">
          Prestataire introuvable.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text variant="heading" size="xl" weight="bold">
            Avis clients
          </Text>
          <Text size="sm" color="secondary">
            {provider.name}
          </Text>
        </View>

        <View style={styles.filtersCard}>
          <Text size="sm" weight="semibold">
            Trier par étoiles
          </Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.filterChip, ratingFilter === 'all' && styles.filterChipActive]}
              onPress={() => setRatingFilter('all')}
            >
              <Text size="xs" color={ratingFilter === 'all' ? 'primary' : 'secondary'}>
                Toutes
              </Text>
            </Pressable>
            {STAR_FILTERS.map((star) => (
              <Pressable
                key={star}
                style={[styles.filterChip, ratingFilter === star && styles.filterChipActive]}
                onPress={() => setRatingFilter(star)}
              >
                <Text size="xs" color={ratingFilter === star ? 'primary' : 'secondary'}>
                  {star} étoile{star > 1 ? 's' : ''}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text size="sm" weight="semibold">
            Trier par âge
          </Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.filterChip, ageSort === 'newest' && styles.filterChipActive]}
              onPress={() => setAgeSort('newest')}
            >
              <Text size="xs" color={ageSort === 'newest' ? 'primary' : 'secondary'}>
                Plus récents
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, ageSort === 'oldest' && styles.filterChipActive]}
              onPress={() => setAgeSort('oldest')}
            >
              <Text size="xs" color={ageSort === 'oldest' ? 'primary' : 'secondary'}>
                Plus anciens
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.resultsHeader}>
          <Text size="sm" color="secondary">
            {reviews.length} avis
          </Text>
        </View>

        {reviews.length > 0 ? (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text size="sm" weight="semibold">
                  {review.author}
                </Text>
                <View style={styles.reviewMeta}>
                  <Icon name="star" size={12} color={theme.colors.accentChampagne} />
                  <Text size="xs" color="secondary">
                    {review.rating}
                  </Text>
                  <Text size="xs" color="secondary">
                    {formatReviewDate(review.createdAt)}
                  </Text>
                </View>
              </View>
              <Text size="sm" color="secondary" style={styles.reviewComment}>
                {review.comment}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text size="sm" color="secondary">
              Aucun avis ne correspond aux filtres.
            </Text>
          </View>
        )}
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
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  filtersCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.secondaryText,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filterChipActive: {
    borderColor: theme.colors.accentChampagne,
    backgroundColor: theme.colors.accentChampagne,
  },
  resultsHeader: {
    marginTop: theme.spacing.xs,
  },
  reviewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewComment: {
    lineHeight: 20,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  fallback: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
