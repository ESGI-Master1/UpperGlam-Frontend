import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { BookingsScreen } from '@/screens/bookings/BookingsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { SearchScreen } from '@/screens/search/SearchScreen';
import { theme } from '@/theme';
import { MainTabParamList } from '@/types/navigation';
import { Icon } from '@/ui';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
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
          if (route.name === 'Home') {
            return <Icon name={focused ? 'home' : 'home-outline'} size={size} color={color} />;
          }

          if (route.name === 'Search') {
            return <Icon name={focused ? 'magnify' : 'magnify'} size={size} color={color} />;
          }

          if (route.name === 'Bookings') {
            return (
              <Icon
                name={focused ? 'calendar-check' : 'calendar-blank-outline'}
                size={size}
                color={color}
              />
            );
          }

          return (
            <Icon
              name={focused ? 'account-circle' : 'account-circle-outline'}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Recherche' }} />
      <Tab.Screen name="Bookings" component={BookingsScreen} options={{ title: 'RDV' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
};
