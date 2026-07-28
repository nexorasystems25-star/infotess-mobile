import { storage } from './storage';
import { localDb, SyncOperation } from './localDb';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  AuthResponse,
  DashboardStats,
  LoginForm,
  Notification,
  Payment,
  PaymentProof,
  Student,
  StudentDues,
  VerifyResult,
  AdminUser,
} from '@/types';

const DEFAULT_BASE = 'http://localhost:3002/api/v1';

// Allow runtime server URL override via AsyncStorage, fallback to env, fallback to localhost
let _runtimeBase: string | null = null;

export async function getBaseUrl(): Promise<string> {
  if (_runtimeBase) return _runtimeBase;
  try {
    const stored = await AsyncStorage.getItem('infotess_server_url');
    if (stored) { _runtimeBase = stored; return stored; }
  } catch {}
  const envUrl = (typeof process !== 'undefined' && (process as any).env?.EXPO_PUBLIC_API_BASE_URL) || '';
  return envUrl || DEFAULT_BASE;
}

export async function setServerUrl(url: string): Promise<void> {
  const clean = url.replace(/\/+$/, '');
  _runtimeBase = clean;
  await AsyncStorage.setItem('infotess_server_url', clean);
}

export async function resetServerUrl(): Promise<void> {
  _runtimeBase = null;
  await AsyncStorage.removeItem('infotess_server_url');
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// ─── Network helper ──────────────────────────────────────────────────────────

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

// ─── Request helpers ─────────────────────────────────────────────────────────

interface RequestOptions extends RequestInit {
  cacheKey?: string;
  allowOffline?: boolean;
  offlineFallback?: () => Promise<any>;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { cacheKey, allowOffline, offlineFallback, ...fetchOpts } = opts;
  const BASE = await getBaseUrl();
  const token = await storage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(fetchOpts.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const online = await isOnline();

  if (!online && allowOffline) {
    if (offlineFallback) {
      try {
        return await offlineFallback();
      } catch {
        // fall through to cache
      }
    }
    if (cacheKey) {
      const cached = await localDb.getCache<T>(cacheKey);
      if (cached !== null) return cached;
    }
    throw new ApiError('Network error — please check your connection or the server URL.', 0);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...fetchOpts, headers });
  } catch (e) {
    if (allowOffline && cacheKey) {
      const cached = await localDb.getCache<T>(cacheKey);
      if (cached !== null) return cached;
    }
    throw new ApiError('Network error — please check your connection or the server URL.', 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body && (body.message || body.error)) || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }

  if (cacheKey) {
    localDb.setCache(cacheKey, body as T).catch(() => {});
  }

  return body as T;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const api = {
  // Auth
  login: (form: LoginForm) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(form) }),
  me: () => request<AuthResponse>('/auth/me'),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  refresh: () => request<AuthResponse>('/auth/refresh', { method: 'POST' }),
  forgotPassword: (email: string) =>
    request<{ ok: true }>('/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) }),

  // Student
  myProfile: () =>
    request<{ student: Student }>('/student/profile', {
      cacheKey: 'infotess_cache:student_profile',
      allowOffline: true,
    }),
  studentSettings: () =>
    request<{ current_academic_year: string; current_semester: string; annual_dues_amount: string }>('/student/settings'),
  myDues: () =>
    request<{ dues: StudentDues }>('/student/dues', {
      cacheKey: 'infotess_cache:student_dues',
      allowOffline: true,
    }),
  myPayments: () =>
    request<{ payments: Payment[] }>('/student/payments', {
      cacheKey: 'infotess_cache:student_payments',
      allowOffline: true,
    }),
  myNotifications: () =>
    request<{ notifications: Notification[] }>('/student/notifications', {
      cacheKey: 'infotess_cache:student_notifications',
      allowOffline: true,
    }),

  // Admin
  dashboard: () =>
    request<{ stats: DashboardStats }>('/admin/dashboard', {
      cacheKey: 'infotess_cache:admin_dashboard',
      allowOffline: true,
    }),
  students: (q?: string, page = 1) =>
    request<{ students: Student[]; total: number; page: number; limit: number }>(
      `/admin/students?q=${encodeURIComponent(q || '')}&page=${page}`,
      {
        cacheKey: `infotess_cache:admin_students:${q || ''}:${page}`,
        allowOffline: true,
      }
    ),
  studentDues: (studentId: number) =>
    request<{ dues: StudentDues }>(`/admin/student_dues?id=${studentId}`),
  recordPayment: (p: {
    student_id: number;
    amount: number;
    academic_year: string;
    semester: string;
    payment_method: string;
    payment_date: string;
    phone_number?: string;
    transaction_id?: string;
    account_number?: string;
  }) =>
    request<{ payment: Payment; receipt_url: string }>('/admin/payments', {
      method: 'POST',
      body: JSON.stringify(p),
      allowOffline: true,
      offlineFallback: async () => {
        const op: SyncOperation = {
          id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          type: 'record_payment',
          payload: p,
          endpoint: '/admin/payments',
          method: 'POST',
          created_at: Date.now(),
          retries: 0,
        };
        await localDb.addPendingSync(op);
        return {
          payment: {
            id: Date.now(),
            ...p,
            receipt_number: `PENDING-${op.id.slice(-6).toUpperCase()}`,
            created_at: new Date().toISOString(),
          } as Payment,
          receipt_url: '',
        };
      },
    }),

  adminPayments: (page = 1) =>
    request<{
      payments: Payment[];
      total: number;
      page: number;
      by_method: { method: string; count: number; amount: number }[];
    }>(`/admin/payments?page=${page}`, {
      cacheKey: 'infotess_cache:admin_payments',
      allowOffline: true,
    }),

  verifyReceipt: (receipt_number: string) =>
    request<{ result: VerifyResult }>(`/verify?q=${encodeURIComponent(receipt_number)}`),

  // Reports
  reportCompliance: () => request<{ rows: any[] }>('/admin/reports?type=compliance'),
  reportDefaulters: () => request<{ rows: any[] }>('/admin/reports?type=defaulters'),
  reportFinancial: (from?: string, to?: string) =>
    request<{ rows: any[] }>(
      `/admin/reports?type=financial${from || to ? `&from=${from || ''}&to=${to || ''}` : ''}`
    ),

  // Users management
  users: () => request<{ users: AdminUser[] }>('/admin/users'),
  createUser: (u: {
    email: string;
    password: string;
    role: string;
    full_name?: string;
    index_number?: string;
    department?: string;
    level?: string;
  }) =>
    request<{ user: AdminUser }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(u),
    }),

  // Settings
  getSettings: () =>
    request<{ settings: Record<string, string> }>('/admin/settings', {
      cacheKey: 'infotess_cache:admin_settings',
      allowOffline: true,
    }),
  updateSettings: (s: {
    annual_dues_amount?: number;
    current_academic_year?: string;
    current_semester?: string;
    org_member_since?: string;
  }) =>
    request<{ settings: Record<string, string> }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(s),
      allowOffline: true,
      offlineFallback: async () => {
        const op: SyncOperation = {
          id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          type: 'update_settings',
          payload: s,
          endpoint: '/admin/settings',
          method: 'PUT',
          created_at: Date.now(),
          retries: 0,
        };
        await localDb.addPendingSync(op);
        const current = await localDb.getCache<Record<string, string>>('infotess_cache:admin_settings');
        const merged = { ...(current || {}), ...Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined)) } as Record<string, string>;
        await localDb.setCache('infotess_cache:admin_settings', merged);
        return { settings: merged };
      },
    }),

  // Receipt
  getReceipt: (paymentId: number, role: 'admin' | 'student' = 'admin') => {
    const base = role === 'student' ? '/student' : '/admin';
    return request<{ receipt: Record<string, any> }>(`${base}/payments/${paymentId}/receipt`);
  },

  // Payment Proofs — Student
  submitProof: (p: {
    payment_method: string;
    amount: number;
    academic_year: string;
    semester: string;
    reference_number?: string;
    sender_phone?: string;
    notes?: string;
    proof_image_url?: string;
  }) =>
    request<{ proof: PaymentProof }>('/student/proofs', {
      method: 'POST',
      body: JSON.stringify(p),
      allowOffline: true,
      offlineFallback: async () => {
        const op: SyncOperation = {
          id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          type: 'submit_proof',
          payload: p,
          endpoint: '/student/proofs',
          method: 'POST',
          created_at: Date.now(),
          retries: 0,
        };
        await localDb.addPendingSync(op);
        return {
          proof: {
            id: Date.now(),
            student_id: 0,
            ...p,
            status: 'pending',
            review_notes: null,
            reviewed_at: null,
            created_at: new Date().toISOString(),
          } as PaymentProof,
        };
      },
    }),

  myProofs: () =>
    request<{ proofs: PaymentProof[] }>('/student/proofs', {
      cacheKey: 'infotess_cache:student_proofs',
      allowOffline: true,
    }),

  // Payment Proofs — Admin
  adminProofs: (status?: string, page = 1) => {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set('status', status);
    return request<{
      proofs: PaymentProof[];
      total: number;
      pending_count: number;
      page: number;
      total_pages: number;
    }>(`/admin/proofs?${params.toString()}`, {
      cacheKey: `infotess_cache:admin_proofs:${status || 'all'}:${page}`,
      allowOffline: true,
    });
  },
  adminProof: (proofId: number) =>
    request<{ proof: PaymentProof }>(`/admin/proofs/${proofId}`),
  approveProof: (proofId: number, review_notes?: string) =>
    request<{ ok: boolean; payment: { id: number; receipt_number: string; amount: number } }>(
      `/admin/proofs/${proofId}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ review_notes: review_notes || '' }),
        allowOffline: true,
        offlineFallback: async () => {
          const op: SyncOperation = {
            id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type: 'submit_proof',
            payload: { proofId, review_notes },
            endpoint: `/admin/proofs/${proofId}/approve`,
            method: 'POST',
            created_at: Date.now(),
            retries: 0,
          };
          await localDb.addPendingSync(op);
          return {
            ok: true,
            payment: {
              id: proofId,
              receipt_number: `PENDING-${op.id.slice(-6).toUpperCase()}`,
              amount: 0,
            },
          };
        },
      }
    ),
  rejectProof: (proofId: number, review_notes?: string) =>
    request<{ ok: boolean; status: string }>(
      `/admin/proofs/${proofId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ review_notes: review_notes || '' }),
        allowOffline: true,
        offlineFallback: async () => {
          const op: SyncOperation = {
            id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type: 'submit_proof',
            payload: { proofId, review_notes },
            endpoint: `/admin/proofs/${proofId}/reject`,
            method: 'POST',
            created_at: Date.now(),
            retries: 0,
          };
          await localDb.addPendingSync(op);
          return { ok: true, status: 'rejected' };
        },
      }
    ),
};

// ─── Sync pending operations ─────────────────────────────────────────────────

const MAX_RETRIES = 3;

export async function syncPendingOperations(): Promise<{ synced: number; failed: number }> {
  const pending = await localDb.getPendingSync();
  let synced = 0;
  let failed = 0;

  for (const op of pending) {
    try {
      const token = await storage.getToken();
      const BASE = await getBaseUrl();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE}${op.endpoint}`, {
        method: op.method,
        headers,
        body: JSON.stringify(op.payload),
      });

      if (res.ok) {
        await localDb.removePendingSync(op.id);
        synced++;
      } else {
        const updatedRetries = op.retries + 1;
        if (updatedRetries > MAX_RETRIES) {
          await localDb.removePendingSync(op.id);
        } else {
          const updated: SyncOperation = { ...op, retries: updatedRetries };
          const all = await localDb.getPendingSync();
          const replaced = all.map((item) => (item.id === op.id ? updated : item));
          const entry = { data: replaced, cached_at: Date.now() } as any;
          await AsyncStorage.setItem('infotess_cache:pending_sync', JSON.stringify(entry));
        }
        failed++;
      }
    } catch {
      const updatedRetries = op.retries + 1;
      if (updatedRetries > MAX_RETRIES) {
        await localDb.removePendingSync(op.id);
      } else {
        const updated: SyncOperation = { ...op, retries: updatedRetries };
        const all = await localDb.getPendingSync();
        const replaced = all.map((item) => (item.id === op.id ? updated : item));
        const entry = { data: replaced, cached_at: Date.now() } as any;
        await AsyncStorage.setItem('infotess_cache:pending_sync', JSON.stringify(entry));
      }
      failed++;
    }
  }

  return { synced, failed };
}

// ─── Force refresh all ───────────────────────────────────────────────────────

export async function forceRefreshAll(role: 'student' | 'admin'): Promise<void> {
  if (role === 'student') {
    await Promise.allSettled([
      api.myProfile(),
      api.myDues(),
      api.myPayments(),
      api.myNotifications(),
      api.myProofs(),
    ]);
  } else {
    await Promise.allSettled([
      api.dashboard(),
      api.students(),
      api.adminPayments(),
      api.adminProofs(),
      api.getSettings(),
    ]);
  }
}
