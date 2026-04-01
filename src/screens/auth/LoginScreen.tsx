import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { ANALYTICS_EVENTS, trackEvent, trackScreenView } from '@/analytics';
import { useAuth } from '@/store';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { Button, Input, KeyboardScreen, Text } from '@/ui';
import {
  AUTH_VALIDATION_MESSAGES,
  EMAIL_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/utils/validation';

interface LoginFormValues {
  email: string;
  password: string;
}

type LoginNavigation = StackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavigation>();
  const { login, isSubmitting, errorMessage, clearError } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_LOGIN, 'Login');
  }, []);

  const submitLogin = async (values: LoginFormValues): Promise<void> => {
    await login({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });
  };

  const goToForgotPassword = (): void => {
    trackEvent(ANALYTICS_EVENTS.CTA_CLICK_FORGOT_PASSWORD_START, {
      screen_name: 'Login',
      cta_name: 'forgot_password_start',
    });
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardScreen>
      <Text variant="heading" size="xxl" weight="bold">
        Connexion
      </Text>
      <Text size="sm" color="secondary" style={styles.subtitle}>
        Accède à ton compte Upper Glam.
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

        {errorMessage ? (
          <Text size="sm" color="accent">
            {errorMessage}
          </Text>
        ) : null}

        <Button
          title="Connexion"
          onPress={handleSubmit(submitLogin)}
          loading={isSubmitting}
          fullWidth
        />
        <Button
          title="Mot de passe oublié ?"
          variant="outline"
          onPress={goToForgotPassword}
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
