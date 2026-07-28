import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student, StudentDues, Payment, Notification, PaymentProof, DashboardStats } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SyncOperation {
  id: string;
  type: 'submit_proof' | 'record_payment' | 'update_settings' | 'mark_notification_read';
  payload: any;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  created_at: number;
  retries: number;
}

interface CacheEntry<T> {
  data: T;
  cached_at: number;
}

// ─── Cache Keys ──────────────────────────────────────────────────────────────

const KEYS = {
  STUDENT_PROFILE: 'infotess_cache:student_profile',
  STUDENT_DUES: 'infotess_cache:student_dues',
  STUDENT_PAYMENTS: 'infotess_cache:student_payments',
  STUDENT_RECEIPTS: 'infotess_cache:student_receipts',
  STUDENT_NOTIFICATIONS: 'infotess_cache:student_notifications',
  STUDENT_PROOFS: 'infotess_cache:student_proofs',
  ADMIN_DASHBOARD: 'infotess_cache:admin_dashboard',
  ADMIN_STUDENTS: 'infotess_cache:admin_students',
  ADMIN_PAYMENTS: 'infotess_cache:admin_payments',
  ADMIN_PROOFS: 'infotess_cache:admin_proofs',
  ADMIN_SETTINGS: 'infotess_cache:admin_settings',
  LAST_SYNC: 'infotess_cache:last_sync',
  PENDING_SYNC: 'infotess_cache:pending_sync',
} as const;

const ALL_CACHE_KEYS = [
  KEYS.STUDENT_PROFILE,
  KEYS.STUDENT_DUES,
  KEYS.STUDENT_PAYMENTS,
  KEYS.STUDENT_RECEIPTS,
  KEYS.STUDENT_NOTIFICATIONS,
  KEYS.STUDENT_PROOFS,
  KEYS.ADMIN_DASHBOARD,
  KEYS.ADMIN_STUDENTS,
  KEYS.ADMIN_PAYMENTS,
  KEYS.ADMIN_PROOFS,
  KEYS.ADMIN_SETTINGS,
  KEYS.LAST_SYNC,
  KEYS.PENDING_SYNC,
];

// ─── Implementation ──────────────────────────────────────────────────────────

export const localDb = {
  // ─── Generic get/set ─────────────────────────────────────────────────────

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      return entry.data;
    } catch {
      return null;
    }
  },

  async getCacheEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      return entry;
    } catch {
      return null;
    }
  },

  async setCache<T>(key: string, data: T): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        cached_at: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Silently fail on cache write errors
    }
  },

  async removeCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Silently fail on cache remove errors
    }
  },

  // ─── Specific data getters ───────────────────────────────────────────────

  async getStudentProfile(): Promise<Student | null> {
    return this.getCache<Student>(KEYS.STUDENT_PROFILE);
  },

  async getStudentDues(): Promise<StudentDues | null> {
    return this.getCache<StudentDues>(KEYS.STUDENT_DUES);
  },

  async getStudentPayments(): Promise<Payment[]> {
    const data = await this.getCache<Payment[]>(KEYS.STUDENT_PAYMENTS);
    return data ?? [];
  },

  async getStudentReceipts(): Promise<Payment[]> {
    const data = await this.getCache<Payment[]>(KEYS.STUDENT_RECEIPTS);
    return data ?? [];
  },

  async getStudentNotifications(): Promise<Notification[]> {
    const data = await this.getCache<Notification[]>(KEYS.STUDENT_NOTIFICATIONS);
    return data ?? [];
  },

  async getStudentProofs(): Promise<PaymentProof[]> {
    const data = await this.getCache<PaymentProof[]>(KEYS.STUDENT_PROOFS);
    return data ?? [];
  },

  async getAdminDashboard(): Promise<DashboardStats | null> {
    return this.getCache<DashboardStats>(KEYS.ADMIN_DASHBOARD);
  },

  async getAdminStudents(): Promise<Student[]> {
    const data = await this.getCache<Student[]>(KEYS.ADMIN_STUDENTS);
    return data ?? [];
  },

  async getAdminPayments(): Promise<Payment[]> {
    const data = await this.getCache<Payment[]>(KEYS.ADMIN_PAYMENTS);
    return data ?? [];
  },

  async getAdminProofs(): Promise<PaymentProof[]> {
    const data = await this.getCache<PaymentProof[]>(KEYS.ADMIN_PROOFS);
    return data ?? [];
  },

  async getAdminSettings(): Promise<Record<string, string> | null> {
    return this.getCache<Record<string, string>>(KEYS.ADMIN_SETTINGS);
  },

  // ─── Sync metadata ──────────────────────────────────────────────────────

  async getLastSync(): Promise<number> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.LAST_SYNC);
      if (!raw) return 0;

      const entry: CacheEntry<number> = JSON.parse(raw);
      return entry.data;
    } catch {
      return 0;
    }
  },

  async setLastSync(): Promise<void> {
    return this.setCache(KEYS.LAST_SYNC, Date.now());
  },

  // ─── Pending sync queue ─────────────────────────────────────────────────

  async getPendingSync(): Promise<SyncOperation[]> {
    try {
      const data = await this.getCache<SyncOperation[]>(KEYS.PENDING_SYNC);
      return data ?? [];
    } catch {
      return [];
    }
  },

  async addPendingSync(op: SyncOperation): Promise<void> {
    try {
      const existing = await this.getPendingSync();
      const updated = [...existing, op];
      const entry: CacheEntry<SyncOperation[]> = {
        data: updated,
        cached_at: Date.now(),
      };
      await AsyncStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify(entry));
    } catch {
      // Silently fail
    }
  },

  async removePendingSync(id: string): Promise<void> {
    try {
      const existing = await this.getPendingSync();
      const updated = existing.filter((op) => op.id !== id);
      const entry: CacheEntry<SyncOperation[]> = {
        data: updated,
        cached_at: Date.now(),
      };
      await AsyncStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify(entry));
    } catch {
      // Silently fail
    }
  },

  async clearPendingSync(): Promise<void> {
    try {
      const entry: CacheEntry<SyncOperation[]> = {
        data: [],
        cached_at: Date.now(),
      };
      await AsyncStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify(entry));
    } catch {
      // Silently fail
    }
  },

  // ─── Bulk operations ────────────────────────────────────────────────────

  async getFreshness(key: string): Promise<number | null> {
    const entry = await this.getCacheEntry<any>(key);
    return entry?.cached_at ?? null;
  },

  async isFresh(key: string, maxAgeMs: number): Promise<boolean> {
    const ts = await this.getFreshness(key);
    if (!ts) return false;
    return Date.now() - ts < maxAgeMs;
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(ALL_CACHE_KEYS);
    } catch {
      // Silently fail
    }
  },
};
