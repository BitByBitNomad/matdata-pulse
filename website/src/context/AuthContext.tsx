import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { extractErrorMessage, tokenStorage } from '../api/client';
import { SafeUser } from '../types/survey';

interface AuthContextValue {
  user: SafeUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(() => {
    const raw = localStorage.getItem('mp_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SafeUser;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(tokenStorage.getAccessToken()));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    authApi
      .me()
      .then((freshUser) => {
        if (freshUser.role !== 'admin') {
          tokenStorage.clear();
          setUser(null);
          setError('Campaign Admin Portal requires Campaign Director (admin) privileges.');
          return;
        }
        setUser(freshUser);
        localStorage.setItem('mp_user', JSON.stringify(freshUser));
      })
      .catch(() => {
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.login(email, password);
      if (data.user.role !== 'admin') {
        throw new Error(
          'Access denied: Campaign Director (admin) role required for Web Dashboard.'
        );
      }
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem('mp_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (err) {
      tokenStorage.clear();
      setUser(null);
      const msg = extractErrorMessage(err, 'Unable to sign in');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout(tokenStorage.getRefreshToken());
    } catch {
      // Ignore network errors on logout
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
