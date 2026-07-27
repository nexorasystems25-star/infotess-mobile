import { storage } from './storage';
import {
  AuthResponse,
  DashboardStats,
  LoginForm,
  Notification,
  Payment,
  Student,
  StudentDues,
  VerifyResult,
  AdminUser,
} from '@/types';

const BASE = 'http://localhost:3002/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await storage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...opts, headers });
  } catch (e) {
    throw new ApiError('Network error — please check your connection or the server URL.', 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body && (body.message || body.error)) || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return body as T;
}

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
  myProfile: () => request<{ student: Student }>('/student/profile'),
  myDues: () => request<{ dues: StudentDues }>('/student/dues'),
  myPayments: () => request<{ payments: Payment[] }>('/student/payments'),
  myNotifications: () => request<{ notifications: Notification[] }>('/student/notifications'),

  // Admin
  dashboard: () => request<{ stats: DashboardStats }>('/admin/dashboard'),
  students: (q?: string, page = 1) =>
    request<{ students: Student[]; total: number; page: number; limit: number }>(
      `/admin/students?q=${encodeURIComponent(q || '')}&page=${page}`
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
  }) => request<{ payment: Payment; receipt_url: string }>('/admin/payments', { method: 'POST', body: JSON.stringify(p) }),

  adminPayments: (page = 1) =>
    request<{ payments: Payment[]; total: number; page: number; by_method: { method: string; count: number; amount: number }[] }>(
      `/admin/payments?page=${page}`
    ),

  verifyReceipt: (receipt_number: string) =>
    request<{ result: VerifyResult }>(`/verify?q=${encodeURIComponent(receipt_number)}`),

  // Reports
  reportCompliance: () => request<{ rows: any[] }>('/admin/reports?type=compliance'),
  reportDefaulters: () => request<{ rows: any[] }>('/admin/reports?type=defaulters'),
  reportFinancial: (from?: string, to?: string) =>
    request<{ rows: any[] }>(`/admin/reports?type=financial${from || to ? `&from=${from || ''}&to=${to || ''}` : ''}`),

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
  }) => request<{ user: AdminUser }>('/admin/users', { method: 'POST', body: JSON.stringify(u) }),

  // Settings
  getSettings: () => request<{ settings: Record<string, string> }>('/admin/settings'),
  updateSettings: (s: { annual_dues_amount?: number }) =>
    request<{ settings: Record<string, string> }>('/admin/settings', { method: 'PUT', body: JSON.stringify(s) }),

  // Receipt
  getReceipt: (paymentId: number, role: 'admin' | 'student' = 'admin') => {
    const base = role === 'student' ? '/student' : '/admin';
    return request<{ receipt: Record<string, any> }>(`${base}/payments/${paymentId}/receipt`);
  },
};
