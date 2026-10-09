import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {loginApi} from '../services/authService';
import {configureApiClient} from '../services/apiClient';
import {clearCarCache} from '../services/carService';

import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from '../storage/authStorage';

import {
  AuthSession,
  LoginRequest,
} from '../types/auth';

interface AuthContextValue {
  session: AuthSession | null;

  isAuthenticated: boolean;
  isBootstrapping: boolean;

  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [session, setSession] =
    useState<AuthSession | null>(null);

  const [isBootstrapping, setIsBootstrapping] =
    useState(true);

  const handleUnauthorized = useCallback(async () => {
    clearCarCache();
    try {
      await clearAuthSession();
    } finally {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    configureApiClient({
      getAccessToken: async () =>
        (await getAuthSession())?.accessToken ?? null,
      onUnauthorized: handleUnauthorized,
    });

    async function bootstrap() {
      try {
        const savedSession = await getAuthSession();
        setSession(savedSession);
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrap();
  }, [handleUnauthorized]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await loginApi(payload);
      clearCarCache();

      const newSession: AuthSession = {
        accessToken: response.accessToken,
        tokenType: response.tokenType,

        expiresAt:
          Date.now() +
          response.expiresIn * 1000,
      };

      await saveAuthSession(newSession);

      setSession(newSession);
    },
    [],
  );

  const logout = useCallback(async () => {
    clearCarCache();
    try {
      await clearAuthSession();
    } finally {
      setSession(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,

      isAuthenticated: Boolean(session),
      isBootstrapping,

      login,
      logout,
    }),
    [
      session,
      isBootstrapping,
      login,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth harus digunakan di dalam AuthProvider.',
    );
  }

  return context;
}