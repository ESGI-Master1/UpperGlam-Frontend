import React from 'react';
import { View, ViewProps, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { theme } from '@theme';

interface CardBaseProps {
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  elevation?: boolean;
  onPress?: TouchableOpacityProps['onPress'];
  children: React.ReactNode;
}

type CardProps = CardBaseProps & Omit<ViewProps, keyof CardBaseProps>;

export const Card: React.FC<CardProps> = ({
  padding = 'lg',
  elevation = true,
  onPress,
  style,
  children,
  ...props
}) => {
  const cardStyle = [
    styles.base,
    {
      padding: theme.spacing[padding],
    },
    elevation && styles.elevation,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  elevation: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
