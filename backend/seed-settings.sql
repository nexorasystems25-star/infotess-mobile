-- Add missing settings (safe to run multiple times)
INSERT INTO system_settings (setting_key, setting_value)
VALUES
  ('current_academic_year', '2026'),
  ('current_semester', '1'),
  ('org_member_since', '2024-09-01')
ON CONFLICT DO NOTHING;

-- If the table has no unique constraint on setting_key, run this instead:
-- DELETE FROM system_settings WHERE setting_key IN ('current_academic_year','current_semester','org_member_since');
-- INSERT INTO system_settings (setting_key, setting_value) VALUES
--   ('current_academic_year', '2026'),
--   ('current_semester', '1'),
--   ('org_member_since', '2024-09-01');

-- Verify all settings
SELECT * FROM system_settings ORDER BY setting_key;
