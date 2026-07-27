# INFOTESS SDMS — Mobile App

Expo / React Native companion to the INFOTESS School Dues Management System.

## Quick Start

```bash
cd "D:\Infotess Mobile App\mobile"
npm install --legacy-peer-deps
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `w` for web.

## Project Structure

```
mobile/
├── app/                          # Expo Router — file-based routing
│   ├── _layout.tsx               # Root layout (auth provider)
│   ├── index.tsx                 # Splash → role-based redirect
│   ├── verify.tsx                # Public receipt verification
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx             # Student/Admin toggle login
│   │   └── forgot-password.tsx
│   ├── (student)/
│   │   ├── _layout.tsx           # Bottom tabs: Home, Payments, Receipts, Profile
│   │   ├── home.tsx              # Dues hero card, progress bar
│   │   ├── payments.tsx          # Payment history list
│   │   ├── receipts.tsx          # Receipt list → open PDF
│   │   └── profile.tsx           # Student info + sign out
│   ├── (admin)/
│   │   ├── _layout.tsx           # Bottom tabs: Dashboard, Students, Payments, Reports, Profile
│   │   ├── home.tsx              # Dashboard stats, charts, quick actions
│   │   ├── students.tsx          # Student list + search
│   │   ├── payments.tsx          # Payment log + method breakdown
│   │   ├── reports.tsx           # Compliance / Defaulters / Financial tabs
│   │   └── profile.tsx           # Admin info + sign out
│   └── admin/
│       ├── record-payment.tsx    # Record payment modal
│       ├── [student].tsx         # Per-student dues detail
│       └── scan.tsx              # QR / receipt verification
├── src/
│   ├── components/ui.tsx         # Card, Stat, Badge, Field, PrimaryButton, GhostButton
│   ├── context/AuthContext.tsx   # Auth state, login/logout, token restore
│   ├── services/api.ts           # API client (all endpoints)
│   ├── services/storage.ts       # SecureStore token persistence
│   ├── theme/theme.ts            # Dark fintech design tokens
│   ├── types/index.ts            # Domain types (User, Student, Payment, etc.)
│   └── config/env.ts             # Environment config
├── assets/                       # Icons, splash
├── app.json                      # Expo config
├── tsconfig.json                 # TypeScript config (strict)
└── package.json
```

## Screen Map

| Role | Screen | Route | Features |
|------|--------|-------|----------|
| — | Splash/redirect | `/` | Role-based routing |
| — | Login | `/(auth)/login` | Student (index#) / Admin (email) toggle |
| — | Forgot password | `/(auth)/forgot-password` | Email reset |
| — | Verify receipt | `/verify` | Public receipt lookup |
| Student | Home | `/(student)/home` | Dues hero, progress bar, quick links |
| Student | Payments | `/(student)/payments` | Payment history list |
| Student | Receipts | `/(student)/receipts` | Receipt list → open PDF |
| Student | Profile | `/(student)/profile` | Info, sign out |
| Admin | Dashboard | `/(admin)/home` | Stats grid, recent payments, quick actions |
| Admin | Students | `/(admin)/students` | Searchable list, pagination |
| Admin | Payments | `/(admin)/payments` | Payment log, method breakdown |
| Admin | Reports | `/(admin)/reports` | Compliance / Defaulters / Financial tabs |
| Admin | Profile | `/(admin)/profile` | Admin info, sign out |
| Admin | Record payment | `/admin/record-payment` | Payment form (MoMo/Bank/Cash) |
| Admin | Student detail | `/admin/[student]` | Per-student dues + payment history |
| Admin | Scan/verify | `/admin/scan` | Receipt verification |

## Design System

- **Theme**: Dark fintech (bg `#0B0F14`, surface `#121821`)
- **Primary**: Mint green `#00E5A0` (paid/success)
- **Accent**: Amber `#FFB347` (pending)
- **Danger**: Coral `#FF5C7A` (unpaid/error)
- **Secondary**: Cool cyan `#4F9EFF` (info/links)
- **Typography**: System font, 4pt spacing grid

## Backend API

The app expects a REST API at `https://infotess.example.com/api` (configurable via `.env`). Key endpoints:

```
POST /auth/login.php         — Login
GET  /auth/me.php            — Current user
POST /auth/logout.php        — Logout
GET  /student/dues.php       — Student dues summary
GET  /student/payments.php   — Student payment history
GET  /admin/dashboard.php    — Admin dashboard stats
GET  /admin/students.php     — Student list + search
POST /admin/payments.php     — Record payment
GET  /admin/reports.php      — Reports (compliance/defaulters/financial)
GET  /verify.php?q=RCP-...   — Receipt verification
```

## Deploy

### Expo Go (testing)
```bash
npx expo start        # scan QR with Expo Go app
```

### EAS Build (production)
```bash
npx eas login
npx eas build --platform all --profile production
```

### EAS Submit
```bash
npx eas submit --platform ios
npx eas submit --platform android
```

## Environment Variables

Create `.env` in the mobile directory:

```
EXPO_PUBLIC_API_BASE_URL=https://your-api.com/api
EXPO_PUBLIC_APP_NAME=INFOTESS SDMS
```

## Tech Stack

- Expo SDK 52
- Expo Router 4 (file-based routing)
- React Native 0.76
- TypeScript 5.3 (strict)
- expo-secure-store (token persistence)
- expo-linear-gradient (UI accents)
- expo-haptics (touch feedback)
- @expo/vector-icons (Ionicons)
