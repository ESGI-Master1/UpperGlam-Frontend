import React, { useEffect } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ANALYTICS_EVENTS, trackEvent, trackScreenView } from '@/analytics';
import { env } from '@/app/config/env';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { Button, Container, Text } from '@/ui';

type WelcomeNavigation = StackNavigationProp<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeNavigation>();
  const insets = useSafeAreaInsets();

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
        "Impossible d'ouvrir la page de création de profil pour le moment."
      );
    }
  };

  return (
    <Container
      style={[
        styles.container,
        {
          paddingTop: Math.max(theme.spacing.xxl * 2.4, insets.top + theme.spacing.xl),
          paddingBottom: insets.bottom + theme.spacing.xl,
        },
      ]}
    >
      <View pointerEvents="none" style={styles.glow} />
      <View style={styles.content}>
        <Text size="xs" color="accent" weight="semibold" style={styles.eyebrow}>
          BEAUTÉ À LA DEMANDE
        </Text>
        <Text variant="heading" size="xxl" weight="bold" style={styles.title}>
          Upper Glam
        </Text>
        <Text size="lg" color="secondary" style={styles.subtitle}>
          Le bon talent. Le bon créneau. Une réservation.
        </Text>
        <View style={styles.promiseLine} />
        <Text size="sm" color="secondary" style={styles.promise}>
          Profils, prestations, prix et disponibilités réunis dans un parcours clair.
        </Text>
      </View>

      <View style={styles.bottomBlock}>
        <View style={styles.actions}>
          <Button title="Se connecter" onPress={goToLogin} fullWidth />
          <Button
            title="Rejoindre Upper Glam"
            onPress={goToPreRegistration}
            variant="outline"
            fullWidth
          />
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -180,
    right: -190,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: theme.colors.accentMuted,
    opacity: 0.72,
  },
  content: {
    gap: theme.spacing.lg,
    maxWidth: 520,
  },
  eyebrow: {
    letterSpacing: 2.4,
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -1,
  },
  subtitle: {
    maxWidth: 360,
    lineHeight: 30,
  },
  promiseLine: {
    width: 44,
    height: 1,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.accentChampagne,
  },
  promise: {
    maxWidth: 340,
    lineHeight: 22,
  },
  bottomBlock: {
    gap: theme.spacing.lg,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
