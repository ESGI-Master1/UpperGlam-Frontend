import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ProviderAgendaScreen } from '@/screens/provider/ProviderAgendaScreen';
import { ProviderDashboardScreen } from '@/screens/provider/ProviderDashboardScreen';
import { ProviderOperationsScreen } from '@/screens/provider/ProviderOperationsScreen';
import { ProviderProfileScreen } from '@/screens/provider/ProviderProfileScreen';
import { theme } from '@/theme';
import { ProviderTabParamList } from '@/types/navigation';
import { Icon } from '@/ui';

const Tab = createBottomTabNavigator<ProviderTabParamList>();

export const ProviderTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.primaryText,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.background,
        },
        tabBarActiveTintColor: theme.colors.accentChampagne,
        tabBarInactiveTintColor: theme.colors.secondaryText,
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'ProviderDashboard') {
            return (
              <Icon
                name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
                size={size}
                color={color}
              />
            );
          }

          if (route.name === 'ProviderAgenda') {
            return (
              <Icon
                name={focused ? 'calendar-clock' : 'calendar-clock-outline'}
                size={size}
                color={color}
              />
            );
          }

          if (route.name === 'ProviderOperations') {
            return (
              <Icon
                name={focused ? 'chart-box' : 'chart-box-outline'}
                size={size}
                color={color}
              />
            );
          }

          return (
            <Icon name={focused ? 'storefront' : 'storefront-outline'} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen
        name="ProviderDashboard"
        component={ProviderDashboardScreen}
        options={{ title: 'Activité' }}
      />
      <Tab.Screen
        name="ProviderAgenda"
        component={ProviderAgendaScreen}
        options={{ title: 'Agenda' }}
      />
      <Tab.Screen
        name="ProviderOperations"
        component={ProviderOperationsScreen}
        options={{ title: 'Ops' }}
      />
      <Tab.Screen
        name="ProviderProfile"
        component={ProviderProfileScreen}
        options={{ title: 'Profil pro' }}
      />
    </Tab.Navigator>
  );
};
