const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3333',
  preRegistrationUrl: process.env.EXPO_PUBLIC_PRE_REGISTRATION_URL ?? 'https://upperglam.fr',
  requestTimeoutMs: parseNumber(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS, 10000),
  useMockData: process.env.EXPO_PUBLIC_USE_MOCK_DATA !== 'false',
  analyticsDevicePepper:
    process.env.EXPO_PUBLIC_ANALYTICS_DEVICE_PEPPER ?? 'upperglam-device-pepper-v1',
  posthogApiKey:
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? process.env.VITE_PUBLIC_POSTHOG_KEY ?? '',
  posthogHost:
    process.env.EXPO_PUBLIC_POSTHOG_HOST ??
    process.env.VITE_PUBLIC_POSTHOG_HOST ??
    'https://app.posthog.com',
} as const;
