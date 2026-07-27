import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { storage } from '@/services/storage';
import { api, ApiError } from '@/services/api';
import * as Haptics from 'expo-haptics';
import { LoginForm, Role, Student, User } from '@/types';

interface AuthState {
  user: User | null;
  student: Student | null;
  loading: boolean;
  error: string | null;
  login: (form: LoginForm) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = await storage.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.me();
        const normalizedUser = {
          ...me.user,
          id: (me.user as any).admin_id || (me.user as any).student_id || me.user.id,
          role: me.user.role || (me.user as any).type,
        };
        setUser(normalizedUser);
        if (me.student) setStudent(me.student);
      } catch (e) {
        await storage.clear();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (form: LoginForm): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(form);
      await storage.setToken(res.access_token);
      // Normalize: backend sends admin_id/student_id, frontend expects id
      const normalizedUser = {
        ...res.user,
        id: (res.user as any).admin_id || (res.user as any).student_id || res.user.id,
        role: res.user.role || (res.user as any).type,
      };
      await storage.setUserId(String(normalizedUser.id));
      await storage.setRole(normalizedUser.role);
      setUser(normalizedUser);
      if (res.student) setStudent(res.student);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Login failed.';
      setError(msg);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await api.logout(); } catch {}
    await storage.clear();
    setUser(null);
    setStudent(null);
    router.replace('/(auth)/login');
  };

  const refresh = async () => {
    try {
      const me = await api.me();
      const normalizedUser = {
        ...me.user,
        id: (me.user as any).admin_id || (me.user as any).student_id || me.user.id,
        role: me.user.role || (me.user as any).type,
      };
      setUser(normalizedUser);
      if (me.student) setStudent(me.student);
    } catch {}
  };

  const value = useMemo<AuthState>(
    () => ({ user, student, loading, error, login, logout, refresh, clearError: () => setError(null) }),
    [user, student, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
