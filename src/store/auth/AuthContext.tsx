import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { ANALYTICS_EVENTS, trackEvent, trackFormError, trackFormSubmit } from '@/analytics';
import { identifyPostHogUser, resetPostHogUser } from '@/analytics/posthog';
import { setAuthTokenProvider } from '@/api/client';
import { loginWithApi, registerWithApi } from '@/services/authService';
import { AuthCredentials } from '@/types/auth';
import { getErrorMessage } from '@/utils/errors';

interface AuthContextValue {
  token: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setAuthTokenProvider(() => token);
  }, [token]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const login = useCallback(async (credentials: AuthCredentials): Promise<void> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    trackFormSubmit(ANALYTICS_EVENTS.FORM_SUBMIT_LOGIN, 'login', { screen_name: 'Login' });

    try {
      const authResult = await loginWithApi(credentials);
      setToken(authResult.token);
      setUserEmail(authResult.userEmail);
      identifyPostHogUser(authResult.userEmail, {
        email: authResult.userEmail,
      });
      trackEvent(ANALYTICS_EVENTS.AUTH_LOGIN_SUCCESS, {
        screen_name: 'Login',
        status: 'success',
      });
    } catch (error) {
      setErrorMessage('Une erreur est survenue.');
      trackFormError(ANALYTICS_EVENTS.FORM_ERROR_LOGIN, 'login', 'api_login_failed', {
        screen_name: 'Login',
      });
      trackEvent(ANALYTICS_EVENTS.AUTH_LOGIN_FAILED, {
        screen_name: 'Login',
        status: 'error',
        error_code: 'api_login_failed',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const register = useCallback(async (credentials: AuthCredentials): Promise<void> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    trackFormSubmit(ANALYTICS_EVENTS.FORM_SUBMIT_REGISTER, 'register', { screen_name: 'Register' });

    try {
      const authResult = await registerWithApi(credentials);
      setToken(authResult.token);
      setUserEmail(authResult.userEmail);
      identifyPostHogUser(authResult.userEmail, {
        email: authResult.userEmail,
      });
      trackEvent(ANALYTICS_EVENTS.AUTH_REGISTER_SUCCESS, {
        screen_name: 'Register',
        status: 'success',
      });
    } catch (error) {
      const message = getErrorMessage(error, "Impossible d'effectuer l'inscription");
      setErrorMessage(message);
      trackFormError(ANALYTICS_EVENTS.FORM_ERROR_REGISTER, 'register', 'api_register_failed', {
        screen_name: 'Register',
      });
      trackEvent(ANALYTICS_EVENTS.AUTH_REGISTER_FAILED, {
        screen_name: 'Register',
        status: 'error',
        error_code: 'api_register_failed',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(() => {
    trackEvent(ANALYTICS_EVENTS.CTA_CLICK_LOGOUT, {
      cta_name: 'logout_button',
      screen_name: 'Profile',
    });
    setToken(null);
    setUserEmail(null);
    setErrorMessage(null);
    resetPostHogUser();
  }, []);

  const contextValue = useMemo<AuthContextValue>(() => {
    return {
      token,
      userEmail,
      isAuthenticated: Boolean(token),
      isSubmitting,
      errorMessage,
      login,
      register,
      logout,
      clearError,
    };
  }, [token, userEmail, isSubmitting, errorMessage, login, register, logout, clearError]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
