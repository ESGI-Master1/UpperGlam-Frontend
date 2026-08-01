import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  forgotPasswordRequest,
  loginRequest,
  registerRequest,
  resetPasswordRequest,
} from '@/api/auth';
import {
  loginWithApi,
  registerWithApi,
  requestPasswordResetWithApi,
  resetPasswordWithApi,
} from './authService';

vi.mock('@/api/auth', () => ({
  forgotPasswordRequest: vi.fn(),
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
  resetPasswordRequest: vi.fn(),
}));

const credentials = { email: 'client@upperglam.fr', password: 'Secret123!' };

describe('authService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps nested login responses and sends the mobile device name', async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      data: {
        token: 'token-123',
        user: { email: 'normalized@upperglam.fr', roles: ['user', 'provider'] },
      },
    });

    await expect(loginWithApi(credentials)).resolves.toEqual({
      token: 'token-123',
      userEmail: 'normalized@upperglam.fr',
      roles: ['user', 'provider'],
    });
    expect(loginRequest).toHaveBeenCalledWith({ ...credentials, deviceName: 'mobile' });
  });

  it('supports top-level register tokens and rejects responses without a token', async () => {
    vi.mocked(registerRequest).mockResolvedValue({ accessToken: 'register-token' });
    await expect(registerWithApi(credentials)).resolves.toEqual({
      token: 'register-token',
      userEmail: credentials.email,
      roles: [],
    });

    vi.mocked(loginRequest).mockResolvedValue({ data: { user: { email: credentials.email } } });
    await expect(loginWithApi(credentials)).rejects.toThrow('Token manquant');
  });

  it('forwards forgot and reset password payloads to the API', async () => {
    vi.mocked(forgotPasswordRequest).mockResolvedValue({});
    vi.mocked(resetPasswordRequest).mockResolvedValue({});

    await requestPasswordResetWithApi(credentials.email);
    await resetPasswordWithApi(credentials.email, '123456', 'NewSecret123!', 'NewSecret123!');

    expect(forgotPasswordRequest).toHaveBeenCalledWith({ email: credentials.email });
    expect(resetPasswordRequest).toHaveBeenCalledWith({
      email: credentials.email,
      code: '123456',
      password: 'NewSecret123!',
      passwordConfirmation: 'NewSecret123!',
    });
  });
});
