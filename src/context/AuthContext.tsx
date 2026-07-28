import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import { storage } from '@/services/storage';
import { api, ApiError, syncPendingOperations, forceRefreshAll } from '@/services/api';
import { localDb } from '@/services/localDb';
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
        if (me.student) {
          setStudent(me.student);
        } else if (normalizedUser.role === 'student') {
          setStudent({
            id: normalizedUser.id,
            index_number: (normalizedUser as any).index_number || '',
            full_name: (normalizedUser as any).full_name || '',
            department: (normalizedUser as any).department || '',
            level: (normalizedUser as any).level || '',
            phone_number: (normalizedUser as any).phone_number || null,
            email: normalizedUser.email,
          });
        }
      } catch (e) {
        // Offline fallback: restore user from cached storage
        const role = await storage.getRole();
        const userId = await storage.getUserId();
        if (role && userId) {
          setUser({ id: Number(userId), email: '', role: role as any, type: role, name: '' });
          // Try to load student data from cache
          if (role === 'student') {
            const cached = await localDb.getStudentProfile();
            if (cached) {
              setStudent(cached);
            }
          }
        } else {
          await storage.clear();
        }
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
      if (res.student) {
        setStudent(res.student);
      } else if (normalizedUser.role === 'student') {
        setStudent({
          id: normalizedUser.id,
          index_number: (normalizedUser as any).index_number || '',
          full_name: (normalizedUser as any).full_name || '',
          department: (normalizedUser as any).department || '',
          level: (normalizedUser as any).level || '',
          phone_number: (normalizedUser as any).phone_number || null,
          email: normalizedUser.email,
        });
      }
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
    await localDb.clearAll();
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
      if (me.student) {
        setStudent(me.student);
      } else if (normalizedUser.role === 'student') {
        setStudent({
          id: normalizedUser.id,
          index_number: (normalizedUser as any).index_number || '',
          full_name: (normalizedUser as any).full_name || '',
          department: (normalizedUser as any).department || '',
          level: (normalizedUser as any).level || '',
          phone_number: (normalizedUser as any).phone_number || null,
          email: normalizedUser.email,
        });
      }
    } catch {}
  };

  // ─── Sync on reconnect ──────────────────────────────────────────────────
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('infotess-online', async () => {
      const token = await storage.getToken();
      const role = await storage.getRole();
      if (!token || !role) return;
      try {
        await syncPendingOperations();
        await forceRefreshAll(role as 'student' | 'admin');
      } catch {}
    });
    return () => sub.remove();
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, student, loading, error, login, logout, refresh, clearError: () => setError(null) }),
    [user, student, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
