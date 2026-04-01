import { AnalyticsEvent } from './events';
import { env } from '@/app/config/env';
import { getAnalyticsContext } from './context';
import { capturePostHogEvent, isPostHogEnabled } from './posthog';
import { EventPayload } from './types';

export const trackEvent = (eventName: AnalyticsEvent, payload: EventPayload = {}): void => {
  const analyticsContext = getAnalyticsContext();

  const eventPayload: Record<string, unknown> = {
    ...payload,
    ...analyticsContext,
    app_env: env.appEnv,
    timestamp: new Date().toISOString(),
  };

  try {
    if (isPostHogEnabled) {
      capturePostHogEvent(eventName, eventPayload);
    }

    if (__DEV__) {
      console.info('[Analytics] Event tracked:', eventName, eventPayload);
    }
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
};

export const trackCTAClick = (ctaName: string, metadata?: Partial<EventPayload>): void => {
  trackEvent('cta_click_pre_registration_start', {
    cta_name: ctaName,
    ...metadata,
  });
};

export const trackFormSubmit = (
  eventName: AnalyticsEvent,
  formName: string,
  metadata?: Partial<EventPayload>
): void => {
  trackEvent(eventName, {
    form_name: formName,
    ...metadata,
  });
};

export const trackFormError = (
  eventName: AnalyticsEvent,
  formName: string,
  errorCode: string,
  metadata?: Partial<EventPayload>
): void => {
  trackEvent(eventName, {
    form_name: formName,
    error_code: errorCode,
    ...metadata,
  });
};
