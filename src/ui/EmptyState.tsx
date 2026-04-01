import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { Text } from './Text';
import { Button } from './Button';
import { theme } from '@theme';

interface EmptyStateProps extends ViewProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, style]} {...props}>
      <Text variant="heading" size="xl" weight="bold" style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text size="md" color="secondary" style={styles.description}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="primary" style={styles.button} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  button: {
    marginTop: theme.spacing.md,
  },
});
