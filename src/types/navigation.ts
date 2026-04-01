import { NavigatorScreenParams } from '@react-navigation/native';
import { ProviderTag } from './provider';

export type MainTabParamList = {
  Home: undefined;
  Search:
    | {
        initialTag?: ProviderTag;
        initialTags?: ProviderTag[];
        initialQuery?: string;
        initialLocation?: string;
        initialDate?: string;
      }
    | undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string } | undefined;
  ResetPassword: { email?: string } | undefined;
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ProviderDetails: { providerId: string };
  ProviderReviews: { providerId: string };
  ManageBooking: { bookingId: string };
  Booking: { providerId: string };
  Payment: { draftId: string };
};

// Extend React Navigation types for type-safe navigation
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
