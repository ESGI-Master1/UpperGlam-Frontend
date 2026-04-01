import React, { useEffect, useMemo, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ANALYTICS_EVENTS, trackEvent, trackScreenView } from '@/analytics';
import { getProviderById, getProviderReviews } from '@/services/providerService';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { Provider, ProviderReview, ProviderTag } from '@/types/provider';
import { Button, Icon, Loader, Text } from '@/ui';
import { formatPrice } from '@/utils/format';

type ProviderDetailsRoute = RouteProp<RootStackParamList, 'ProviderDetails'>;
type ProviderDetailsNavigation = StackNavigationProp<RootStackParamList, 'ProviderDetails'>;

const formatReviewAge = (isoDate: string): string => {
  const createdAt = new Date(isoDate);
  const now = new Date();
  const daysAgo = Math.max(
    0,
    Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (daysAgo < 1) {
    return "Aujourd'hui";
  }

  if (daysAgo < 7) {
    return `Il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`;
  }

  const weeksAgo = Math.floor(daysAgo / 7);
  return `Il y a ${weeksAgo} semaine${weeksAgo > 1 ? 's' : ''}`;
};

const tagLabelByKey: Record<ProviderTag, string> = {
  hair: 'Coiffure',
  makeup: 'Makeup',
  nails: 'Nails',
  skincare: 'Skincare',
  barber: 'Barber',
};

export const ProviderDetailsScreen: React.FC = () => {
  const route = useRoute<ProviderDetailsRoute>();
  const navigation = useNavigation<ProviderDetailsNavigation>();
  const insets = useSafeAreaInsets();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<ProviderReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProvider = async (): Promise<void> => {
      setIsLoading(true);
      const [providerResult, reviewsResult] = await Promise.all([
        getProviderById(route.params.providerId),
        getProviderReviews(route.params.providerId),
      ]);
      setProvider(providerResult);
      setReviews(reviewsResult);
      setIsLoading(false);
    };

    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_PROVIDER_DETAILS, 'ProviderDetails', {
      entrypoint: 'search',
    });
    void loadProvider();
  }, [route.params.providerId]);

  const previewReviews = useMemo(() => reviews.slice(0, 2), [reviews]);

  const canHome = provider?.serviceModes.includes('home') ?? false;
  const canInstitute = provider?.serviceModes.includes('institute') ?? false;

  const bookNow = (): void => {
    if (!provider) {
      return;
    }

    trackEvent(ANALYTICS_EVENTS.CTA_CLICK_BOOK_NOW, {
      screen_name: 'ProviderDetails',
      cta_name: provider.id,
    });
    navigation.navigate('Booking', { providerId: provider.id });
  };

  if (isLoading) {
    return <Loader fullScreen text="Chargement du profil..." />;
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
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image source={{ uri: provider.coverImageUrl }} style={styles.coverImage} />
          <View style={styles.heroOverlay} />
        </View>
        <View style={styles.heroBadge}>
          <Icon name="star" size={14} color={theme.colors.accentChampagne} />
          <Text size="sm" color="primary" weight="semibold">
            {provider.rating.toFixed(1)} ({provider.reviewCount} avis)
          </Text>
        </View>

        <View style={styles.profileCard}>
          <Image source={{ uri: provider.avatarImageUrl }} style={styles.avatar} />
          <Text variant="heading" size="xxl" weight="bold" style={styles.name}>
            {provider.name}
          </Text>
          <View style={styles.locationRow}>
            <Icon name="map-marker-outline" size={16} color={theme.colors.secondaryText} />
            <Text size="sm" color="secondary">
              {provider.city}
            </Text>
          </View>

          <View style={styles.tagRow}>
            {provider.tags.map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text size="xs" color="secondary">
                  {tagLabelByKey[tag]}
                </Text>
              </View>
            ))}
          </View>

          <Text size="md" color="secondary" style={styles.bio}>
            {provider.bio}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="heading" size="lg" weight="bold">
            Photos récentes
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryList}
          >
            {provider.gallery.map((item) => (
              <View key={item.id} style={styles.galleryItem}>
                <Image source={{ uri: item.imageUrl }} style={styles.galleryImage} />
                <Text size="xs" color="secondary" style={styles.galleryTitle}>
                  {item.title}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text variant="heading" size="lg" weight="bold">
            Modes de rendez-vous
          </Text>
          <View style={styles.modeList}>
            {canHome ? (
              <View style={styles.modePill}>
                <Icon name="home-map-marker" size={14} color={theme.colors.accentChampagne} />
                <Text size="sm" color="secondary">
                  Le prestataire se déplace à domicile
                </Text>
              </View>
            ) : null}
            {canInstitute ? (
              <View style={styles.modePill}>
                <Icon name="storefront-outline" size={14} color={theme.colors.accentChampagne} />
                <Text size="sm" color="secondary">
                  Rendez-vous en institut
                </Text>
              </View>
            ) : null}
          </View>
          {provider.instituteAddress ? (
            <View style={styles.instituteAddress}>
              <Icon name="map-marker-outline" size={14} color={theme.colors.secondaryText} />
              <Text size="sm" color="secondary">
                {provider.instituteAddress}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text variant="heading" size="lg" weight="bold">
            Derniers avis clients
          </Text>
          <View style={styles.reviewsCard}>
            {previewReviews.length > 0 ? (
              previewReviews.map((review) => (
                <View key={review.id} style={styles.reviewItem}>
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
                      {formatReviewAge(review.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <Text size="sm" color="secondary" style={styles.reviewComment}>
                    {review.comment}
                  </Text>
                </View>
              ))
            ) : (
              <Text size="sm" color="secondary">
                Aucun avis disponible pour le moment.
              </Text>
            )}
          </View>
          {reviews.length > 0 ? (
            <View style={styles.reviewButtonWrapper}>
              <Button
                title="Voir tous les avis"
                onPress={() => navigation.navigate('ProviderReviews', { providerId: provider.id })}
                variant="tertiary"
                fullWidth
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing.sm }]}>
        <Button
          title={`Réserver dès ${formatPrice(provider.priceFrom)}`}
          onPress={bookNow}
          fullWidth
        />
      </View>
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
  },
  hero: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 11, 12, 0.28)',
  },
  heroBadge: {
    alignSelf: 'flex-end',
    marginTop: -theme.spacing.lg,
    marginRight: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(17, 17, 20, 0.85)',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    zIndex: 3,
    elevation: 6,
  },
  profileCard: {
    marginTop: -theme.spacing.xl,
    marginHorizontal: theme.spacing.md,
    zIndex: 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: theme.colors.accentChampagne,
  },
  name: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  locationRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  tagPill: {
    backgroundColor: theme.colors.background,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  bio: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  galleryList: {
    marginTop: theme.spacing.md,
    paddingRight: theme.spacing.lg,
  },
  galleryItem: {
    width: 138,
    marginRight: theme.spacing.md,
  },
  galleryImage: {
    width: '100%',
    height: 178,
    borderRadius: 12,
  },
  galleryTitle: {
    marginTop: theme.spacing.xs,
  },
  modeList: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  instituteAddress: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
  },
  reviewsCard: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  reviewItem: {
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
  reviewButtonWrapper: {
    marginTop: theme.spacing.md,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
  },
  fallback: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
