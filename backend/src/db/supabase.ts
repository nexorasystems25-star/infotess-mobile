import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

if (!config.supabaseUrl || !config.supabaseServiceKey) {
  console.error('⚠️  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

// Service role client (full access, bypasses RLS)
export const supabase: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey,
  {
    auth: { persistSession: false },
  }
);

// Anon client (respects RLS, used for public endpoints)
export const supabaseAnon: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: { persistSession: false },
  }
);
