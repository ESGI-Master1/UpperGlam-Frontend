import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_SESSION_STORAGE_KEY = '@upperglam/auth-session';

export type StoredActiveExperience = 'client' | 'provider';

export interface StoredAuthSession {
  token: string;
  userEmail: string;
  roles: string[];
  activeExperience: StoredActiveExperience;
}

const isStoredAuthSession = (value: unknown): value is StoredAuthSession => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<StoredAuthSession>;
  return (
    typeof session.token === 'string' &&
    session.token.trim().length > 0 &&
    typeof session.userEmail === 'string' &&
    session.userEmail.trim().length > 0 &&
    Array.isArray(session.roles) &&
    session.roles.every((role) => typeof role === 'string') &&
    (session.activeExperience === 'client' || session.activeExperience === 'provider')
  );
};

export const loadAuthSession = async (): Promise<StoredAuthSession | null> => {
  const serializedSession = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!serializedSession) {
    return null;
  }

  try {
    const session: unknown = JSON.parse(serializedSession);
    if (isStoredAuthSession(session)) {
      return session;
    }
  } catch {
    // The invalid entry is removed below so it cannot break future startups.
  }

  await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  return null;
};

export const saveAuthSession = async (session: StoredAuthSession): Promise<void> => {
  await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const clearAuthSession = async (): Promise<void> => {
  await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
};
