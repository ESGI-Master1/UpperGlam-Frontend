import React, { useState } from 'react';
import { TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { theme } from '@theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, helperText, style, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text size="sm" weight="medium" color="secondary" style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        style={[styles.input, isFocused && styles.inputFocused, error && styles.inputError, style]}
        placeholderTextColor={theme.colors.secondaryText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && (
        <Text size="xs" color="accent" style={styles.errorText}>
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text size="xs" color="secondary" style={styles.helperText}>
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primaryText,
    fontFamily: theme.typography.fontFamily.body,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: theme.colors.accentChampagne,
  },
  inputError: {
    borderColor: theme.colors.accentChampagne,
  },
  errorText: {
    marginTop: theme.spacing.xs,
  },
  helperText: {
    marginTop: theme.spacing.xs,
  },
});
