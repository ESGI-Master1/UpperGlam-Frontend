import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { flushPostHog, initPostHog } from '@/analytics/posthog';
import { env } from '@/app/config/env';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, BookingProvider } from '@/store';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  useEffect(() => {
    initPostHog();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active') {
        void flushPostHog();
      }
    });

    return () => {
      subscription.remove();
      void flushPostHog();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StripeProvider
        publishableKey={env.stripePublishableKey}
        merchantIdentifier={env.stripeMerchantIdentifier || undefined}
      >
        <AuthProvider>
          <BookingProvider>{children}</BookingProvider>
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
};
