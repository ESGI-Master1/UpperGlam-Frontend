import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { theme } from '@theme';

interface TextProps extends RNTextProps {
  variant?: 'heading' | 'body';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'accent';
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  size = 'md',
  weight = 'regular',
  color = 'primary',
  style,
  children,
  ...props
}) => {
  const textStyle = [
    styles.base,
    {
      fontFamily:
        variant === 'heading'
          ? theme.typography.fontFamily.heading
          : theme.typography.fontFamily.body,
      fontSize: theme.typography.fontSize[size],
      fontWeight: theme.typography.fontWeight[weight],
      color:
        color === 'primary'
          ? theme.colors.primaryText
          : color === 'secondary'
            ? theme.colors.secondaryText
            : theme.colors.accentChampagne,
    },
    style,
  ];

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
