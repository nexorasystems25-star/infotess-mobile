-- INFOTESS SDMS: payment_proofs table
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

CREATE TABLE IF NOT EXISTS payment_proofs (
  id bigserial PRIMARY KEY,
  student_id bigint REFERENCES students(id) ON DELETE CASCADE,
  payment_method text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  academic_year text NOT NULL,
  semester text NOT NULL,
  reference_number text,
  sender_phone text,
  notes text,
  proof_image_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by bigint REFERENCES users(id),
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_proofs_student ON payment_proofs(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON payment_proofs(status);
