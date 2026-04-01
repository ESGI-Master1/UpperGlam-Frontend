import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import {
  ANALYTICS_EVENTS,
  trackEvent,
  trackFormError,
  trackFormSubmit,
  trackScreenView,
} from '@/analytics';
import { requestPasswordResetWithApi } from '@/services/authService';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { Button, Input, KeyboardScreen, Text } from '@/ui';
import { getErrorMessage } from '@/utils/errors';
import { AUTH_VALIDATION_MESSAGES, EMAIL_PATTERN } from '@/utils/validation';

interface ForgotPasswordFormValues {
  email: string;
}

type ForgotPasswordNavigation = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;
type ForgotPasswordRoute = RouteProp<RootStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordNavigation>();
  const route = useRoute<ForgotPasswordRoute>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: route.params?.email ?? '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_FORGOT_PASSWORD, 'ForgotPassword');
  }, []);

  const submitForgotPassword = async (values: ForgotPasswordFormValues): Promise<void> => {
    const sanitizedEmail = values.email.trim().toLowerCase();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    trackFormSubmit(ANALYTICS_EVENTS.FORM_SUBMIT_FORGOT_PASSWORD, 'forgot_password', {
      screen_name: 'ForgotPassword',
    });

    try {
      await requestPasswordResetWithApi(sanitizedEmail);
      trackEvent(ANALYTICS_EVENTS.AUTH_PASSWORD_RESET_REQUEST_SUCCESS, {
        screen_name: 'ForgotPassword',
        status: 'success',
      });
      setSuccessMessage('Si cet email existe, un code de réinitialisation vient d’être envoyé.');
      navigation.navigate('ResetPassword', { email: sanitizedEmail });
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Impossible de lancer la réinitialisation pour le moment.'
      );
      setErrorMessage(message);
      trackFormError(
        ANALYTICS_EVENTS.FORM_ERROR_FORGOT_PASSWORD,
        'forgot_password',
        'forgot_password_request_failed',
        {
          screen_name: 'ForgotPassword',
        }
      );
      trackEvent(ANALYTICS_EVENTS.AUTH_PASSWORD_RESET_REQUEST_FAILED, {
        screen_name: 'ForgotPassword',
        status: 'error',
        error_code: 'forgot_password_request_failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardScreen>
      <Text variant="heading" size="xxl" weight="bold">
        Mot de passe oublié
      </Text>
      <Text size="sm" color="secondary" style={styles.subtitle}>
        Entre ton email pour recevoir les instructions de réinitialisation.
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
          title="Envoyer le code"
          onPress={handleSubmit(submitForgotPassword)}
          loading={isSubmitting}
          fullWidth
        />
        <Button
          title="J'ai déjà un code"
          variant="outline"
          onPress={() => navigation.navigate('ResetPassword')}
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
