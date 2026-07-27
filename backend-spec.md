# INFOTESS SDMS Mobile Backend - Standalone Dev API Spec

## Stack
- **Runtime**: Node.js 20+ (Express)
- **Database**: SQLite (better-sqlite3) - zero-config, file-based
- **Auth**: JWT (access + refresh tokens), bcrypt for password hashing
- **Port**: 3001 (dev)
- **API Base**: `http://localhost:3001/api/v1`

---

## Database Schema (SQLite - adapted from MySQL)

```sql
-- users table (unified: students + admins)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','admin','executive','super_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','banned')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- students profile (linked to users)
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  index_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL,
  phone_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- executives (society leadership)
CREATE TABLE executives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  email TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- activities
CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  activity_date DATETIME NOT NULL,
  image_url TEXT,
  registration_link TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- events
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATETIME NOT NULL,
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- payments
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('Cash','Mobile Money','Bank Transfer')),
  payment_date DATE NOT NULL,
  receipt_number TEXT UNIQUE NOT NULL,
  recorded_by INTEGER NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- receipts
CREATE TABLE receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  receipt_file_path TEXT NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verification_hash TEXT NOT NULL
);

-- audit_logs
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- notifications
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- department_info (key-value settings)
CREATE TABLE department_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_name TEXT UNIQUE NOT NULL,
  content TEXT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- system_settings (for dues amount)
CREATE TABLE system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL
);

-- Indexes
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_receipt ON payments(receipt_number);
CREATE INDEX idx_receipts_payment ON receipts(payment_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
```

---

## Seed Data (for instant dev login)

| Role | Email | Password | Index Number | Notes |
|------|-------|----------|--------------|-------|
| Super Admin | admin@infotess.com | admin123 | - | Full access |
| Admin | exec@infotess.com | exec123 | - | Executive role |
| Student | student@infotess.com | student123 | INF/2024/001 | Computer Science, Level 200 |
| Student | john@infotess.com | student123 | INF/2024/002 | IT, Level 300 |
| Student | ama@infotess.com | student123 | INF/2024/003 | CS, Level 100 |

- Annual dues: GHS 200.00 (in `system_settings`)

---

## API Endpoints (matching mobile app's `api.ts` expectations)

### Auth
| Method | Path | Auth | Body/Query | Response |
|--------|------|------|------------|----------|
| POST | `/auth/login` | ❌ | `{ index_number?, email?, password, role?: 'student'|'admin' }` | `{ ok, access_token, refresh_token, user: { type, id, name, email?, index_number?, role? } }` |
| GET | `/auth/me` | ✅ Bearer | - | `{ ok, user: {...} }` |
| POST | `/auth/logout` | ✅ Bearer | - | `{ ok: true }` |
| POST | `/auth/forgot` | ❌ | `{ email }` | `{ ok: true }` |

**Login Logic:**
- Student: provide `index_number` + `password` + `role: 'student'`
- Admin: provide `email` + `password` + `role: 'admin'`

### Student (requires student token)
| Method | Path | Response |
|--------|------|----------|
| GET | `/student/profile` | `{ student: { id, index_number, full_name, department, level, phone_number, email } }` |
| GET | `/student/dues` | `{ dues: { required: 200, paid: 150, balance: 50, academic_year, semester } }` |
| GET | `/student/payments` | `{ payments: Payment[] }` |
| GET | `/student/notifications` | `{ notifications: Notification[] }` |

### Admin (requires admin token)
| Method | Path | Query/Body | Response |
|--------|------|------------|----------|
| GET | `/admin/dashboard` | - | `{ stats: { total_students, total_payments, total_revenue, compliance_rate, pending_verifications, recent_payments: Payment[] } }` |
| GET | `/admin/students` | `q`, `page`, `limit` | `{ students: Student[], total: number, page, total_pages }` |
| GET | `/admin/student_dues` | `id` (student_id) | `{ dues: { required, paid, balance, payments: Payment[] } }` |
| POST | `/admin/payments` | `{ student_id, amount, academic_year, semester, payment_method, payment_date }` | `{ payment: Payment, receipt_url: string }` |
| GET | `/admin/reports` | `type=compliance\|defaulters\|financial`, `from`, `to` | `{ rows: any[] }` |
| GET | `/admin/users` | - | `{ users: AdminUser[] }` |
| POST | `/admin/users` | `{ email, password, role, full_name?, index_number? }` | `{ user: AdminUser }` |

### Public
| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/verify` | `q` (receipt_number) | `{ result: { valid, receipt_number, student_name, amount, payment_date, payment_method, verification_hash } }` |

---

## TypeScript Types (matching mobile `src/types/index.ts`)

```ts
interface Student {
  id: number;
  index_number: string;
  full_name: string;
  department: string;
  level: string;
  phone_number?: string;
  email?: string;
}

interface Payment {
  payment_id: number;
  student_id: number;
  amount: number;
  academic_year: string;
  semester: string;
  payment_date: string;
  payment_method: 'Cash' | 'Mobile Money' | 'Bank Transfer';
  receipt_number: string;
  created_at: string;
  full_name?: string;
  index_number?: string;
}

interface StudentDues {
  required: number;
  paid: number;
  balance: number;
  academic_year: string;
  semester: string;
}

interface DashboardStats {
  total_students: number;
  total_payments: number;
  total_revenue: number;
  compliance_rate: number;
  pending_verifications: number;
  recent_payments: Payment[];
}

interface VerifyResult {
  valid: boolean;
  receipt_number: string;
  student_name: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  verification_hash: string;
}

interface AdminUser {
  id: number;
  email: string;
  role: string;
  full_name?: string;
  index_number?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
```

---

## Auth Flow (JWT)

1. **Login** → returns `{ access_token, refresh_token }`
   - Access: 15 min, RS256 or HS256
   - Refresh: 7 days, httpOnly cookie or body
2. **Requests** → `Authorization: Bearer <access_token>`
3. **Refresh** → POST `/auth/refresh` with refresh token → new access token
4. **Logout** → invalidate refresh token (blacklist or DB revoke)

---

## Mobile App Integration

Update `src/services/api.ts`:
```ts
const BASE = __DEV__ ? 'http://10.0.2.2:3001/api/v1' : 'https://api.infotess.app/api/v1';
// 10.0.2.2 = Android emulator host, use localhost for iOS sim
```

Endpoints map 1:1 with existing `api.ts` - just change base URL and path prefix.

---

## Dev Commands

```bash
cd mobile/backend
npm install
npm run dev          # tsx watch src/index.ts (port 3001)
npm run db:seed      # tsx src/db/seed.ts
npm run build        # tsc
npm start            # node dist/index.js
```

---

## Project Structure (to create)

```
mobile/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── src/
│   │   ├── index.ts              # Express app entry
│   │   ├── config.ts             # env, constants
│   │   ├── db/
│   │   │   ├── index.ts          # better-sqlite3 setup
│   │   │   ├── schema.sql        # DDL
│   │   │   └── seed.ts           # seed data
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT verify
│   │   │   ├── validate.ts       # zod schemas
│   │   │   └── error.ts          # error handler
│   │   ├── routes/
│   │   │   ├── auth.ts           # login, me, logout, forgot, refresh
│   │   │   ├── student.ts        # profile, dues, payments, notifications
│   │   │   ├── admin.ts          # dashboard, students, dues, payments, reports, users
│   │   │   └── public.ts         # verify receipt
│   │   ├── services/
│   │   │   ├── auth.ts           # jwt, bcrypt, tokens
│   │   │   ├── payments.ts       # payment logic, receipt number gen
│   │   │   └── reports.ts        # compliance, defaulters, financial
│   │   └── utils/
│   │       ├── receipt.ts        # generate receipt number, hash
│   │       └── logger.ts
│   └── data/
│       └── infotess.db           # SQLite file (gitignored)
```

---

## Quick-Start Commands for Agents

Each agent gets a focused task:

### Agent 1: Database & Schema
- Create `backend/` folder, `package.json`, `tsconfig.json`
- Install deps: `express`, `better-sqlite3`, `bcryptjs`, `jsonwebtoken`, `zod`, `cors`, `dotenv`
- Dev deps: `typescript`, `tsx`, `@types/*`
- Write `src/db/schema.sql` + `src/db/index.ts` (DB connection)
- Write `src/db/seed.ts` with seed data above
- Run `npm run db:seed` → creates `data/infotess.db`

### Agent 2: Auth + Student Routes
- `src/middleware/auth.ts` (JWT verify, role guards)
- `src/services/auth.ts` (hash, tokens, verify)
- `src/routes/auth.ts` (POST /login, GET /me, POST /logout, POST /forgot, POST /refresh)
- `src/routes/student.ts` (GET /profile, /dues, /payments, /notifications)
- Wire in `src/index.ts`

### Agent 3: Admin Routes + Payments + Reports
- `src/services/payments.ts` (create payment, calc dues, receipt number)
- `src/services/reports.ts` (3 report queries)
- `src/routes/admin.ts` (dashboard, students, student_dues, payments, reports, users)
- `src/routes/public.ts` (GET /verify)
- Wire in `src/index.ts`

### Agent 4: Mobile App Integration
- Update `mobile/src/services/api.ts` BASE URL to `http://10.0.2.2:3001/api/v1`
- Update endpoint paths to match new `/api/v1/` prefix
- Test: `npx expo start` → verify login works against local backend