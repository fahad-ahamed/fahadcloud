'use client';

import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { apiClient } from '@/services/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await apiClient.getMe();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient.login(email, password);
    await checkAuth();
    return data;
  }, [checkAuth]);

  const register = useCallback(async (data: any) => {
    return apiClient.register(data);
  }, []);

  const logout = useCallback(() => {
    document.cookie = 'fahadcloud-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiClient.getMe();
      setUser(data.user);
    } catch {}
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
