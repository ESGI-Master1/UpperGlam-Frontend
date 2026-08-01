import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { ANALYTICS_EVENTS, trackEvent, trackFormError, trackFormSubmit } from '@/analytics';
import { identifyPostHogUser, resetPostHogUser, setAnalyticsConsent } from '@/analytics/posthog';
import { setAuthTokenProvider } from '@/api/client';
import { getMeRequest } from '@/api/users';
import { clearAuthSession, loadAuthSession, saveAuthSession } from '@/services/authSessionService';
import { loginWithApi, registerWithApi } from '@/services/authService';
import { AuthCredentials } from '@/types/auth';
import { getErrorMessage } from '@/utils/errors';

type ActiveExperience = 'client' | 'provider';

interface AuthContextValue {
  token: string | null;
  userEmail: string | null;
  userRoles: string[];
  activeExperience: ActiveExperience;
  isAuthenticated: boolean;
  isProvider: boolean;
  isProviderExperience: boolean;
  isHydrating: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  switchExperience: (experience: ActiveExperience) => void;
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
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [activeExperience, setActiveExperience] = useState<ActiveExperience>('client');
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setAuthTokenProvider(() => token);
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async (): Promise<void> => {
      try {
        const session = await loadAuthSession();
        if (!session || !isMounted) {
          return;
        }

        const restoredExperience =
          session.activeExperience === 'provider' && session.roles.includes('provider')
            ? 'provider'
            : 'client';

        setAuthTokenProvider(() => session.token);
        setToken(session.token);
        setUserEmail(session.userEmail);
        setUserRoles(session.roles);
        setActiveExperience(restoredExperience);
        identifyPostHogUser(session.userEmail, { email: session.userEmail });

        try {
          const profile = await getMeRequest();
          if (isMounted) {
            setAnalyticsConsent(profile.preferences?.analyticsEnabled === true);
          }
        } catch {
          // A temporary API outage must not destroy a valid local session.
        }
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const switchExperience = useCallback(
    (experience: ActiveExperience): void => {
      if (experience === 'provider' && !userRoles.includes('provider')) {
        return;
      }

      setActiveExperience(experience);
    },
    [userRoles]
  );

  const login = useCallback(async (credentials: AuthCredentials): Promise<void> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    trackFormSubmit(ANALYTICS_EVENTS.FORM_SUBMIT_LOGIN, 'login', { screen_name: 'Login' });

    try {
      const authResult = await loginWithApi(credentials);
      const nextExperience = authResult.roles.includes('provider') ? 'provider' : 'client';
      await saveAuthSession({
        token: authResult.token,
        userEmail: authResult.userEmail,
        roles: authResult.roles,
        activeExperience: nextExperience,
      });
      setToken(authResult.token);
      setAuthTokenProvider(() => authResult.token);
      setUserEmail(authResult.userEmail);
      setUserRoles(authResult.roles);
      setActiveExperience(nextExperience);
      try {
        const profile = await getMeRequest();
        setAnalyticsConsent(profile.preferences?.analyticsEnabled === true);
      } catch {
        setAnalyticsConsent(false);
      }
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
      const nextExperience = authResult.roles.includes('provider') ? 'provider' : 'client';
      await saveAuthSession({
        token: authResult.token,
        userEmail: authResult.userEmail,
        roles: authResult.roles,
        activeExperience: nextExperience,
      });
      setToken(authResult.token);
      setAuthTokenProvider(() => authResult.token);
      setUserEmail(authResult.userEmail);
      setUserRoles(authResult.roles);
      setActiveExperience(nextExperience);
      try {
        const profile = await getMeRequest();
        setAnalyticsConsent(profile.preferences?.analyticsEnabled === true);
      } catch {
        setAnalyticsConsent(false);
      }
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
    setUserRoles([]);
    setActiveExperience('client');
    setErrorMessage(null);
    setAuthTokenProvider(() => null);
    void clearAuthSession();
    setAnalyticsConsent(false);
    resetPostHogUser();
  }, []);

  const contextValue = useMemo<AuthContextValue>(() => {
    return {
      token,
      userEmail,
      userRoles,
      activeExperience,
      isAuthenticated: Boolean(token),
      isProvider: userRoles.includes('provider'),
      isProviderExperience: userRoles.includes('provider') && activeExperience === 'provider',
      isHydrating,
      isSubmitting,
      errorMessage,
      switchExperience,
      login,
      register,
      logout,
      clearError,
    };
  }, [
    token,
    userEmail,
    userRoles,
    activeExperience,
    isHydrating,
    isSubmitting,
    errorMessage,
    switchExperience,
    login,
    register,
    logout,
    clearError,
  ]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
