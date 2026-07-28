import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3002', 10),
  jwtSecret: process.env.JWT_SECRET || 'infotess-dev-secret-key-change-in-prod',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'infotess-dev-refresh-secret-change-in-prod',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  annualDues: 200.00,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};
