import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  ANALYTICS_EVENTS,
  trackEvent,
  trackFormError,
  trackFormSubmit,
  trackScreenView,
} from '@/analytics';
import { resetPasswordWithApi } from '@/services/authService';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { Button, Input, KeyboardScreen, Text } from '@/ui';
import { getErrorMessage } from '@/utils/errors';
import {
  AUTH_VALIDATION_MESSAGES,
  EMAIL_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/utils/validation';

interface ResetPasswordFormValues {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

type ResetPasswordNavigation = StackNavigationProp<RootStackParamList, 'ResetPassword'>;
type ResetPasswordRoute = RouteProp<RootStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ResetPasswordNavigation>();
  const route = useRoute<ResetPasswordRoute>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      email: route.params?.email ?? '',
      code: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const passwordValue = watch('password');

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_RESET_PASSWORD, 'ResetPassword');
  }, []);

  const submitResetPassword = async (values: ResetPasswordFormValues): Promise<void> => {
    const sanitizedEmail = values.email.trim().toLowerCase();
    const sanitizedCode = values.code.trim();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    trackFormSubmit(ANALYTICS_EVENTS.FORM_SUBMIT_RESET_PASSWORD, 'reset_password', {
      screen_name: 'ResetPassword',
    });
    trackEvent(ANALYTICS_EVENTS.AUTH_PASSWORD_RESET_WITH_CODE, {
      screen_name: 'ResetPassword',
      code: sanitizedCode,
    });

    try {
      await resetPasswordWithApi(
        sanitizedEmail,
        sanitizedCode,
        values.password,
        values.confirmPassword
      );
      trackEvent(ANALYTICS_EVENTS.AUTH_PASSWORD_RESET_SUCCESS, {
        screen_name: 'ResetPassword',
        status: 'success',
        code: sanitizedCode,
      });
      setSuccessMessage('Mot de passe mis à jour. Tu peux te connecter.');
      navigation.navigate('Login');
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Impossible de réinitialiser le mot de passe pour le moment.'
      );
      setErrorMessage(message);
      trackFormError(
        ANALYTICS_EVENTS.FORM_ERROR_RESET_PASSWORD,
        'reset_password',
        'reset_password_failed',
        {
          screen_name: 'ResetPassword',
        }
      );
      trackEvent(ANALYTICS_EVENTS.AUTH_PASSWORD_RESET_FAILED, {
        screen_name: 'ResetPassword',
        status: 'error',
        error_code: 'reset_password_failed',
        code: sanitizedCode,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardScreen>
      <Text variant="heading" size="xxl" weight="bold">
        Réinitialiser le mot de passe
      </Text>
      <Text size="sm" color="secondary" style={styles.subtitle}>
        Saisis ton email, le code reçu, puis ton nouveau mot de passe.
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
                setErrorMessage(null);
                setSuccessMessage(null);
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
          name="code"
          rules={{
            required: AUTH_VALIDATION_MESSAGES.resetTokenRequired,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Code de réinitialisation"
              value={value}
              onBlur={onBlur}
              onChangeText={(text) => {
                setErrorMessage(null);
                setSuccessMessage(null);
                onChange(text);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Code reçu par email"
              error={errors.code?.message}
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
              label="Nouveau mot de passe"
              value={value}
              onBlur={onBlur}
              onChangeText={(text) => {
                setErrorMessage(null);
                setSuccessMessage(null);
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
                setErrorMessage(null);
                setSuccessMessage(null);
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

        {successMessage ? (
          <Text size="sm" color="secondary">
            {successMessage}
          </Text>
        ) : null}

        <Button
          title="Mettre à jour le mot de passe"
          onPress={handleSubmit(submitResetPassword)}
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
