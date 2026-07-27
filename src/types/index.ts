// INFOTESS SDMS — domain types aligned with the Node.js/Express backend.

export type Role = 'student' | 'executive' | 'admin' | 'super_admin';

export type UserStatus = 'active' | 'inactive' | 'banned';

export interface User {
  id: number;
  email: string;
  role: Role;
  type: string;
  name: string;
  status?: UserStatus;
  created_at?: string;
}

export interface Student {
  id: number;
  index_number: string;
  full_name: string;
  department: string;
  level: string;
  phone_number: string | null;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank Transfer';

export interface Payment {
  id: number;
  payment_id: number;
  student_id?: number;
  amount: number;
  academic_year: string;
  semester: string;
  payment_method: PaymentMethod;
  payment_date: string;
  receipt_number: string;
  recorded_by?: number;
  created_at: string;
  // joined (computed)
  student?: Pick<Student, 'id' | 'index_number' | 'full_name' | 'department' | 'level'>;
  recorder?: Pick<User, 'id' | 'email'>;
}

export interface Receipt {
  id: number;
  payment_id: number;
  receipt_file_path: string;
  generated_at: string;
  verification_hash: string;
}

export interface DashboardStats {
  total_students: number;
  total_payments: number;
  total_revenue: number;
  compliance_rate: number;
  recent_payments: Payment[];
}

export interface StudentDues {
  // Backend fields
  required: number;
  paid: number;
  balance: number;
  academic_year: string;
  semester: string;
  // Computed aliases used by screens
  total_due: number;
  total_paid: number;
  outstanding: number;
  status: 'paid' | 'partially_paid' | 'unpaid';
  payments: Payment[];
  student: Student;
}

export interface AuthResponse {
  access_token: string;
  user: User;
  student?: Student;
}

export interface LoginForm {
  email?: string;        // admin/exec login
  index_number?: string; // student login
  password: string;
  role: 'student' | 'admin';
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface VerifyResult {
  valid: boolean;
  receipt?: Payment & { receipt?: Receipt; student?: Student };
  reason?: string;
}

export interface AdminUser {
  id: number;
  email: string;
  role: Role;
  name?: string;
  type?: string;
}
