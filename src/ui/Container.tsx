import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { theme } from '@theme';

interface ContainerProps extends ViewProps {
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  backgroundColor?: 'background' | 'surface';
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({
  padding = 'lg',
  backgroundColor = 'background',
  style,
  children,
  ...props
}) => {
  const containerStyle = [
    styles.base,
    {
      padding: theme.spacing[padding],
      backgroundColor:
        backgroundColor === 'background' ? theme.colors.background : theme.colors.surface,
    },
    style,
  ];

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
