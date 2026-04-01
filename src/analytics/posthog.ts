import { PostHog } from 'posthog-react-native';
import { env } from '@/app/config/env';

const isProductionBuild = env.appEnv.toLowerCase() === 'production' && !__DEV__;
const hasPostHogConfig = env.posthogApiKey.trim().length > 0;

export const isPostHogEnabled = isProductionBuild && hasPostHogConfig;

let client: PostHog | null = null;
type CaptureProperties = NonNullable<Parameters<PostHog['capture']>[1]>;
type IdentifyProperties = NonNullable<Parameters<PostHog['identify']>[1]>;

const getClient = (): PostHog | null => {
  if (!isPostHogEnabled) {
    return null;
  }

  if (client) {
    return client;
  }

  client = new PostHog(env.posthogApiKey, {
    host: env.posthogHost,
    flushAt: 5,
    flushInterval: 10000,
  });

  return client;
};

export const initPostHog = (): void => {
  try {
    void getClient();
  } catch (error) {
    console.error('[Analytics] Failed to initialize PostHog:', error);
  }
};

export const capturePostHogEvent = (
  eventName: string,
  payload: Record<string, unknown> = {}
): void => {
  try {
    const posthog = getClient();
    if (!posthog) {
      return;
    }

    posthog.capture(eventName, payload as CaptureProperties);
  } catch (error) {
    console.error('[Analytics] Failed to capture PostHog event:', error);
  }
};

export const identifyPostHogUser = (
  distinctId: string,
  properties: Record<string, unknown> = {}
): void => {
  try {
    const posthog = getClient();
    if (!posthog) {
      return;
    }

    posthog.identify(distinctId, properties as IdentifyProperties);
  } catch (error) {
    console.error('[Analytics] Failed to identify PostHog user:', error);
  }
};

export const resetPostHogUser = (): void => {
  try {
    const posthog = getClient();
    if (!posthog) {
      return;
    }

    posthog.reset();
  } catch (error) {
    console.error('[Analytics] Failed to reset PostHog user:', error);
  }
};

export const flushPostHog = async (): Promise<void> => {
  try {
    const posthog = getClient();
    if (!posthog) {
      return;
    }

    await posthog.flush();
  } catch (error) {
    console.error('[Analytics] Failed to flush PostHog queue:', error);
  }
};
