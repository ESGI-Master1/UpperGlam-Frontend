import React, { useEffect } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { ANALYTICS_EVENTS, trackEvent, trackScreenView } from '@/analytics';
import { env } from '@/app/config/env';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { Button, Container, Text } from '@/ui';

type WelcomeNavigation = StackNavigationProp<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeNavigation>();

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_WELCOME, 'Welcome');
  }, []);

  const goToLogin = (): void => {
    trackEvent(ANALYTICS_EVENTS.CTA_CLICK_LOGIN_START, {
      screen_name: 'Welcome',
      cta_name: 'start_login',
    });
    navigation.navigate('Login');
  };

  const goToPreRegistration = async (): Promise<void> => {
    trackEvent(ANALYTICS_EVENTS.CTA_CLICK_PRE_REGISTRATION_START, {
      screen_name: 'Welcome',
      cta_name: 'start_pre_registration',
    });

    try {
      await Linking.openURL(env.preRegistrationUrl);
    } catch {
      trackEvent(ANALYTICS_EVENTS.FORM_ERROR_PRE_REGISTRATION, {
        screen_name: 'Welcome',
        error_code: 'open_pre_registration_url_failed',
      });
      Alert.alert(
        'Lien indisponible',
        "Impossible d'ouvrir la page de pré-inscription pour le moment."
      );
    }
  };

  return (
    <Container style={styles.container}>
      <View style={styles.content}>
        <Text variant="heading" size="xxl" weight="bold">
          Upper Glam
        </Text>
        <Text size="md" color="secondary" style={styles.subtitle}>
          Réserve ton prestataire beauté rapidement, où tu veux.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button title="Se connecter" onPress={goToLogin} fullWidth />
        <Button
          title="Se pré-inscrire"
          onPress={goToPreRegistration}
          variant="outline"
          fullWidth
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xxl * 2,
    paddingBottom: theme.spacing.xxl,
  },
  content: {
    gap: theme.spacing.md,
  },
  subtitle: {
    maxWidth: 320,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
