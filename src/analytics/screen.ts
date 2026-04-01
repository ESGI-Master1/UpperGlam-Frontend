import { AnalyticsEvent } from './events';
import { ANALYTICS_EVENTS } from './events';
import { trackEvent } from './track';
import { ScreenViewPayload } from './types';

export const trackScreenView = (
  eventName: AnalyticsEvent,
  screenName: string,
  metadata?: Partial<ScreenViewPayload>
): void => {
  trackEvent(eventName, {
    screen_name: screenName,
    ...metadata,
  });
};

export const useScreenTracking = (_navigation: unknown): void => {
  if (__DEV__) {
    console.info('[Analytics] useScreenTracking is not wired yet');
  }
};

export const SCREEN_EVENT_BY_NAME = {
  Welcome: ANALYTICS_EVENTS.SCREEN_VIEW_WELCOME,
  Login: ANALYTICS_EVENTS.SCREEN_VIEW_LOGIN,
  Register: ANALYTICS_EVENTS.SCREEN_VIEW_REGISTER,
  ForgotPassword: ANALYTICS_EVENTS.SCREEN_VIEW_FORGOT_PASSWORD,
  ResetPassword: ANALYTICS_EVENTS.SCREEN_VIEW_RESET_PASSWORD,
  Home: ANALYTICS_EVENTS.SCREEN_VIEW_HOME,
  Search: ANALYTICS_EVENTS.SCREEN_VIEW_SEARCH,
  ProviderDetails: ANALYTICS_EVENTS.SCREEN_VIEW_PROVIDER_DETAILS,
  Booking: ANALYTICS_EVENTS.SCREEN_VIEW_BOOKING,
  Payment: ANALYTICS_EVENTS.SCREEN_VIEW_PAYMENT,
  Bookings: ANALYTICS_EVENTS.SCREEN_VIEW_BOOKINGS,
  Profile: ANALYTICS_EVENTS.SCREEN_VIEW_PROFILE,
} as const;
