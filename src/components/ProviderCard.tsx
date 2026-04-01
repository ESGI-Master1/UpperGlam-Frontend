import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { theme } from '@/theme';
import { Provider } from '@/types/provider';
import { Card, Icon, Text } from '@/ui';
import { formatPrice } from '@/utils/format';

interface ProviderCardProps {
  provider: Provider;
  onPress: (providerId: string) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onPress }) => {
  const canHome = provider.serviceModes.includes('home');
  const canInstitute = provider.serviceModes.includes('institute');

  return (
    <Card onPress={() => onPress(provider.id)} style={styles.card}>
      <Image source={{ uri: provider.coverImageUrl }} style={styles.coverImage} />

      <View style={styles.headerRow}>
        <Text variant="heading" size="lg" weight="bold">
          {provider.name}
        </Text>
        <View style={styles.ratingRow}>
          <Icon name="star" size={14} color={theme.colors.accentChampagne} />
          <Text size="sm" color="secondary">
            {provider.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      <View style={styles.cityRow}>
        <Icon name="map-marker-outline" size={14} color={theme.colors.secondaryText} />
        <Text size="sm" color="secondary">
          {provider.city} · {provider.reviewCount} avis
        </Text>
      </View>

      <Text size="sm" color="secondary" numberOfLines={2} style={styles.bio}>
        {provider.bio}
      </Text>

      <View style={styles.modeRow}>
        {canHome ? (
          <View style={styles.modePill}>
            <Icon name="home-map-marker" size={13} color={theme.colors.secondaryText} />
            <Text size="xs" color="secondary">
              Se déplace
            </Text>
          </View>
        ) : null}
        {canInstitute ? (
          <View style={styles.modePill}>
            <Icon name="storefront-outline" size={13} color={theme.colors.secondaryText} />
            <Text size="xs" color="secondary">
              En institut
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footerRow}>
        <Text size="sm" color="accent">
          Dès {formatPrice(provider.priceFrom)}
        </Text>
        <Text size="xs" color="secondary">
          {provider.tags.join(' • ')}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 144,
    borderRadius: 10,
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.xs,
  },
  bio: {
    marginTop: theme.spacing.sm,
  },
  modeRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.secondaryText,
    backgroundColor: theme.colors.surface,
  },
  footerRow: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
});
