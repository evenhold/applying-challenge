'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type AuthUser, type AuthTokens, login as authLogin, parseJwtPayload, isTokenExpired } from '../lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedTokens = localStorage.getItem('auth_tokens');
    if (storedTokens) {
      try {
        const parsed = JSON.parse(storedTokens) as AuthTokens;
        if (!isTokenExpired(parsed.accessToken)) {
          setTokens(parsed);
          setUser(parseJwtPayload(parsed.idToken));
        } else {
          localStorage.removeItem('auth_tokens');
        }
      } catch {
        localStorage.removeItem('auth_tokens');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const newTokens = await authLogin(email, password);
    setTokens(newTokens);
    setUser(parseJwtPayload(newTokens.idToken));
    localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
  }, []);

  const logout = useCallback(() => {
    setTokens(null);
    setUser(null);
    localStorage.removeItem('auth_tokens');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
