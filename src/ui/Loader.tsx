import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewProps } from 'react-native';
import { Text } from './Text';
import { theme } from '@theme';

interface LoaderProps extends ViewProps {
  size?: 'small' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'large',
  text,
  fullScreen = false,
  style,
  ...props
}) => {
  const containerStyle = [styles.container, fullScreen && styles.fullScreen, style];

  return (
    <View style={containerStyle} {...props}>
      <ActivityIndicator size={size} color={theme.colors.accentChampagne} />
      {text && (
        <Text size="sm" color="secondary" style={styles.text}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  text: {
    marginTop: theme.spacing.md,
  },
});
