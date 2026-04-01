import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { env } from '@/app/config/env';

interface AnalyticsContext {
  device_os: string;
  device_os_version: string;
  app_version: string;
  app_build_version: string;
  device_brand: string;
  device_model_group: string;
  device_model_hash: string;
  device_model_is_pseudonymized: true;
  analytics_context_version: 'v1';
}

const UNKNOWN = 'unknown';

const normalizeText = (value: string | null | undefined): string => {
  if (!value) {
    return UNKNOWN;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : UNKNOWN;
};

// FNV-1a hash for deterministic pseudonymization of the device model.
const hashValue = (value: string): string => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
};

const getModelGroup = (rawModel: string | null | undefined): string => {
  const model = normalizeText(rawModel);

  if (model === UNKNOWN) {
    return UNKNOWN;
  }

  if (model.includes('iphone')) {
    return 'iphone';
  }

  if (model.includes('ipad')) {
    return 'ipad';
  }

  if (model.includes('pixel')) {
    return 'pixel';
  }

  if (model.includes('galaxy')) {
    return 'galaxy';
  }

  const [firstToken] = model.split(' ');
  return firstToken || UNKNOWN;
};

const platformVersion = Platform.Version;

const getOsVersion = (): string => {
  if (Device.osVersion) {
    return normalizeText(Device.osVersion);
  }

  return normalizeText(String(platformVersion));
};

const buildAnalyticsContext = (): AnalyticsContext => {
  const rawModel = normalizeText(Device.modelName);
  const pepper = normalizeText(env.analyticsDevicePepper);

  return {
    device_os: normalizeText(Device.osName ?? Platform.OS),
    device_os_version: getOsVersion(),
    app_version: normalizeText(Application.nativeApplicationVersion),
    app_build_version: normalizeText(Application.nativeBuildVersion),
    device_brand: normalizeText(Device.brand ?? Device.manufacturer),
    device_model_group: getModelGroup(rawModel),
    device_model_hash: rawModel === UNKNOWN ? UNKNOWN : hashValue(`${pepper}:${rawModel}`),
    device_model_is_pseudonymized: true,
    analytics_context_version: 'v1',
  };
};

const analyticsContext = buildAnalyticsContext();

export const getAnalyticsContext = (): AnalyticsContext => analyticsContext;
