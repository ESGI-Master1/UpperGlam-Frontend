import React from 'react';
import { NavigationContainer, DarkTheme, Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './navigation/RootNavigator';
import { AppProviders } from './providers/AppProviders';
import { theme } from '@/theme';

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.primaryText,
    border: theme.colors.background,
    primary: theme.colors.accentChampagne,
    notification: theme.colors.accentHover,
  },
};

export const AppRoot: React.FC = () => {
  return (
    <AppProviders>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AppProviders>
  );
};
