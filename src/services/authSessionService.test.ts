import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
  StoredAuthSession,
} from './authSessionService';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const session: StoredAuthSession = {
  token: 'token-123',
  userEmail: 'provider+001@upperglam.dev',
  roles: ['provider'],
  activeExperience: 'provider',
};

describe('authSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists and restores a valid session', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(session));

    await saveAuthSession(session);
    await expect(loadAuthSession()).resolves.toEqual(session);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@upperglam/auth-session',
      JSON.stringify(session)
    );
  });

  it('removes an invalid persisted session', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue('{"token":42}');

    await expect(loadAuthSession()).resolves.toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@upperglam/auth-session');
  });

  it('clears the persisted session on logout', async () => {
    await clearAuthSession();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@upperglam/auth-session');
  });
});
