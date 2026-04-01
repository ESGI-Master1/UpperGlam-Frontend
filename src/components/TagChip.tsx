import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { ProviderTag } from '@/types/provider';
import { Text } from '@/ui';

interface TagChipProps {
  tag: ProviderTag;
  selected: boolean;
  onPress: (tag: ProviderTag) => void;
}

const labelByTag: Record<ProviderTag, string> = {
  hair: 'Coiffure',
  makeup: 'Makeup',
  nails: 'Nails',
  skincare: 'Skincare',
  barber: 'Barber',
};

export const TagChip: React.FC<TagChipProps> = ({ tag, selected, onPress }) => {
  return (
    <Pressable
      onPress={() => onPress(tag)}
      style={[styles.base, selected ? styles.selected : styles.unselected]}
    >
      <Text size="sm" weight="medium" color={selected ? 'primary' : 'secondary'}>
        {labelByTag[tag]}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  selected: {
    borderColor: theme.colors.accentChampagne,
    backgroundColor: theme.colors.accentChampagne,
  },
  unselected: {
    borderColor: theme.colors.secondaryText,
    backgroundColor: theme.colors.surface,
  },
});
