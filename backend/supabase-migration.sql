-- INFOTESS SDMS — Full Supabase Setup (tables + seed)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/uxsdpxezyapwcwadjmws/sql

-- ============================================================
-- 1. TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','admin','executive','super_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','banned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_password_reset BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  index_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  profile_picture TEXT,
  class_name TEXT,
  stream TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('Cash','Mobile Money','Bank Transfer')),
  payment_date DATE NOT NULL,
  receipt_number TEXT UNIQUE NOT NULL,
  recorded_by INTEGER NOT NULL REFERENCES users(id),
  phone_number TEXT,
  transaction_id TEXT,
  account_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  receipt_file_path TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  verification_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id),
  title TEXT,
  content TEXT NOT NULL,
  is_broadcast BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_reads (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  source_url TEXT UNIQUE,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_year ON payments(academic_year);
CREATE INDEX IF NOT EXISTS idx_receipts_payment ON receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_students_index ON students(index_number);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);

-- ============================================================
-- 3. SEED DATA
-- ============================================================

-- Users
--   admin@infotess.com  = admin123
--   all others          = student123
INSERT INTO users (email, password_hash, role, status) VALUES
  ('admin@infotess.com',    '$2y$10$YRNoSKY.hpBVI8PGmwOMNOZAmYXoAIzsnr0Py0vqoHiERUihByEkq', 'super_admin', 'active'),
  ('student@infotess.com',  '$2y$10$X6T3ArzbSCZ.uwkr8JCSp..YRM4j1vQISghQNPGYEgUVEg1Xu/ogu', 'student',     'active'),
  ('ama@infotess.com',      '$2y$10$X6T3ArzbSCZ.uwkr8JCSp..YRM4j1vQISghQNPGYEgUVEg1Xu/ogu', 'student',     'active'),
  ('john@infotess.com',     '$2y$10$X6T3ArzbSCZ.uwkr8JCSp..YRM4j1vQISghQNPGYEgUVEg1Xu/ogu', 'student',     'active'),
  ('test2@student.com',     '$2y$10$X6T3ArzbSCZ.uwkr8JCSp..YRM4j1vQISghQNPGYEgUVEg1Xu/ogu', 'student',     'active')
ON CONFLICT (email) DO NOTHING;

-- Students  (index format: 52301000XX)
INSERT INTO students (user_id, index_number, full_name, department, level, phone_number) VALUES
  (2, '5230100001', 'Ama Serwaa',   'B.Ed. Information Technology', '100', '+233244123456'),
  (4, '5230100002', 'John Mensah',  'Computer Science',            '200', '+233201122334'),
  (3, '5230100003', 'Ama Kwarteng', 'B.Ed. Information Technology', '100', '+233551234567'),
  (5, '5230100005', 'Kofi Asante',  'Computer Science',            '100', '+233279988776')
ON CONFLICT (index_number) DO NOTHING;

-- System settings
INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('annual_dues_amount', '200.00'),
  ('current_academic_year', '2025/2026'),
  ('current_semester', '1')
ON CONFLICT (setting_key) DO NOTHING;

-- Payments  (4 records, total GH₵ 375)
INSERT INTO payments (student_id, amount, academic_year, semester, payment_method, payment_date, receipt_number, recorded_by) VALUES
  (1, 100.00, '2026', '1', 'Cash',          '2026-03-10', 'INFO-2603-0001', 1),
  (1,  50.00, '2026', '1', 'Mobile Money',  '2026-04-02', 'INFO-2604-0002', 1),
  (3, 150.00, '2026', '1', 'Bank Transfer', '2026-03-18', 'INFO-2603-0004', 1),
  (2,  75.00, '2026', '1', 'Cash',          '2026-04-24', 'INFO-2604-0005', 1)
ON CONFLICT (receipt_number) DO NOTHING;

-- Receipts  (4 records with auto-generated hashes)
INSERT INTO receipts (payment_id, receipt_file_path, verification_hash) VALUES
  (1, 'receipt_INFO-2603-0001.html', encode(sha256(('INFO-2603-0001' || '100.00')::bytea), 'hex')),
  (2, 'receipt_INFO-2604-0002.html', encode(sha256(('INFO-2604-0002' || '50.00')::bytea), 'hex')),
  (3, 'receipt_INFO-2603-0004.html', encode(sha256(('INFO-2603-0004' || '150.00')::bytea), 'hex')),
  (4, 'receipt_INFO-2604-0005.html', encode(sha256(('INFO-2604-0005' || '75.00')::bytea), 'hex'));

-- Notifications
INSERT INTO notifications (user_id, title, message) VALUES
  (2, 'Welcome to INFOTESS Portal', 'Welcome to the INFOTESS student portal. Check your dashboard regularly for updates.'),
  (2, 'Dues Payment Reminder', 'Please review your dues status and complete pending payments before the deadline.');
