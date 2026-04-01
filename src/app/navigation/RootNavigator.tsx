import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabNavigator } from './MainTabNavigator';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '@/screens/auth/ResetPasswordScreen';
import { BookingScreen } from '@/screens/booking/BookingScreen';
import { ManageBookingScreen } from '@/screens/bookings/ManageBookingScreen';
import { PaymentScreen } from '@/screens/payment/PaymentScreen';
import { ProviderDetailsScreen } from '@/screens/search/ProviderDetailsScreen';
import { ProviderReviewsScreen } from '@/screens/search/ProviderReviewsScreen';
import { useAuth } from '@/store';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator
      key={isAuthenticated ? 'app' : 'auth'}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.primaryText,
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Connexion' }} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: 'Mot de passe oublié' }}
          />
          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{ title: 'Réinitialisation' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Tabs" component={MainTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="ProviderDetails"
            component={ProviderDetailsScreen}
            options={{ title: 'Prestataire' }}
          />
          <Stack.Screen
            name="ProviderReviews"
            component={ProviderReviewsScreen}
            options={{ title: 'Tous les avis' }}
          />
          <Stack.Screen
            name="Booking"
            component={BookingScreen}
            options={{ title: 'Réservation' }}
          />
          <Stack.Screen
            name="ManageBooking"
            component={ManageBookingScreen}
            options={{ title: 'Gérer le rendez-vous' }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: 'Changer le mot de passe' }}
          />
          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{ title: 'Réinitialisation' }}
          />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Paiement' }} />
        </>
      )}
    </Stack.Navigator>
  );
};
