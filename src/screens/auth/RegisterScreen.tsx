import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { ANALYTICS_EVENTS, trackScreenView } from '@/analytics';
import { useAuth } from '@/store';
import { theme } from '@/theme';
import { Button, Input, KeyboardScreen, Text } from '@/ui';
import {
  AUTH_VALIDATION_MESSAGES,
  EMAIL_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/utils/validation';

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterScreen: React.FC = () => {
  const { register, isSubmitting, errorMessage, clearError } = useAuth();
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const passwordValue = watch('password');

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_REGISTER, 'Register');
  }, []);

  const submitRegister = async (values: RegisterFormValues): Promise<void> => {
    await register({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });
  };

  return (
    <KeyboardScreen>
      <Text variant="heading" size="xxl" weight="bold">
        Inscription
      </Text>
      <Text size="sm" color="secondary" style={styles.subtitle}>
        Crée ton compte en quelques secondes.
      </Text>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          rules={{
            required: AUTH_VALIDATION_MESSAGES.emailRequired,
            pattern: {
              value: EMAIL_PATTERN,
              message: AUTH_VALIDATION_MESSAGES.emailInvalid,
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              value={value}
              onBlur={onBlur}
              onChangeText={(text) => {
                clearError();
                onChange(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="toi@email.com"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          rules={{
            required: AUTH_VALIDATION_MESSAGES.passwordRequired,
            minLength: {
              value: PASSWORD_MIN_LENGTH,
              message: AUTH_VALIDATION_MESSAGES.passwordMinLength,
            },
            maxLength: {
              value: PASSWORD_MAX_LENGTH,
              message: AUTH_VALIDATION_MESSAGES.passwordMaxLength,
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Mot de passe"
              value={value}
              onBlur={onBlur}
              onChangeText={(text) => {
                clearError();
                onChange(text);
              }}
              secureTextEntry
              autoCapitalize="none"
              placeholder="********"
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: AUTH_VALIDATION_MESSAGES.confirmPasswordRequired,
            validate: (value) => {
              return value === passwordValue || AUTH_VALIDATION_MESSAGES.passwordMismatch;
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirmer le mot de passe"
              value={value}
              onBlur={onBlur}
              onChangeText={(text) => {
                clearError();
                onChange(text);
              }}
              secureTextEntry
              autoCapitalize="none"
              placeholder="********"
              error={errors.confirmPassword?.message}
            />
          )}
        />

        {errorMessage ? (
          <Text size="sm" color="accent">
            {errorMessage}
          </Text>
        ) : null}

        <Button
          title="Créer mon compte"
          onPress={handleSubmit(submitRegister)}
          loading={isSubmitting}
          fullWidth
        />
      </View>
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    marginTop: theme.spacing.sm,
  },
  form: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
});
