-- Step 2: Run after Step 1 succeeds

-- Reset sequences
ALTER SEQUENCE students_id_seq RESTART WITH 1;
ALTER SEQUENCE payments_id_seq RESTART WITH 1;
ALTER SEQUENCE receipts_id_seq RESTART WITH 1;
ALTER SEQUENCE system_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;

-- USERS
INSERT INTO users (email, password_hash, role, status) VALUES
  ('admin@infotess.com',    '$2y$10$YRNoSKY.hpBVI8PGmwOMNOZAmYXoAIzsnr0Py0vqoHiERUihByEkq', 'super_admin', 'active'),
  ('student@infotess.com',  '$2y$10$X6T3ArzbSCZ.uwkr8JCSp..YRM4j1vQISghQNPGYEgUVEg1Xu/ogu', 'student',     'active'),
  ('ama@infotess.com',      '$2y$10$X6T3ArzbSCZ.uwkr8JCSp..YRM4j1vQISghQNPGYEgUVEg1Xu/ogu', 'student',     'active'),
  ('john@infotess.com',     '$2y$10$X6T3ArzbSCZ.uwkr8JCSp..YRM4j1vQISghQNPGYEgUVEg1Xu/ogu', 'student',     'active'),
  ('test2@student.com',     '$2y$10$X6T3ArzbSCZ.uwkr8JCSp..YRM4j1vQISghQNPGYEgUVEg1Xu/ogu', 'student',     'active')
ON CONFLICT (email) DO NOTHING;

-- STUDENTS
INSERT INTO students (user_id, index_number, full_name, department, level, phone_number) VALUES
  (2, '5230100001', 'Ama Serwaa',   'B.Ed. Information Technology', '100', '+233244123456'),
  (4, '5230100002', 'John Mensah',  'Computer Science',            '200', '+233201122334'),
  (3, '5230100003', 'Ama Kwarteng', 'B.Ed. Information Technology', '100', '+233551234567'),
  (5, '5230100005', 'Kofi Asante',  'Computer Science',            '100', '+233279988776');

-- SYSTEM SETTINGS
INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('annual_dues_amount', '200.00');

-- PAYMENTS
INSERT INTO payments (student_id, amount, academic_year, semester, payment_method, payment_date, receipt_number, recorded_by) VALUES
  (1, 100.00, '2026', '1', 'Cash',          '2026-03-10', 'INFO-2603-0001', 1),
  (1,  50.00, '2026', '1', 'Mobile Money',  '2026-04-02', 'INFO-2604-0002', 1),
  (3, 150.00, '2026', '1', 'Bank Transfer', '2026-03-18', 'INFO-2603-0004', 1),
  (2,  75.00, '2026', '1', 'Cash',          '2026-04-24', 'INFO-2604-0005', 1);

-- RECEIPTS
INSERT INTO receipts (payment_id, receipt_file_path, verification_hash) VALUES
  (1, 'receipt_INFO-2603-0001.html', encode(sha256(('INFO-2603-0001' || '100.00')::bytea), 'hex')),
  (2, 'receipt_INFO-2604-0002.html', encode(sha256(('INFO-2604-0002' || '50.00')::bytea), 'hex')),
  (3, 'receipt_INFO-2603-0004.html', encode(sha256(('INFO-2603-0004' || '150.00')::bytea), 'hex')),
  (4, 'receipt_INFO-2604-0005.html', encode(sha256(('INFO-2604-0005' || '75.00')::bytea), 'hex'));

-- NOTIFICATIONS
INSERT INTO notifications (user_id, title, message) VALUES
  (2, 'Welcome to INFOTESS Portal', 'Welcome to the INFOTESS student portal. Check your dashboard regularly for updates.'),
  (2, 'Dues Payment Reminder', 'Please review your dues status and complete pending payments before the deadline.');
