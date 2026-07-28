import { Router, Request, Response } from 'express';
import { supabase } from '../db/index.js';

const router = Router();

// GET /verify (public - no auth required)
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const receiptNumber = (req.query.q as string || '').trim();
    if (!receiptNumber) {
      res.status(400).json({ error: 'receipt_number (q) is required' });
      return;
    }

    const { data: receipt } = await supabase
      .from('payments')
      .select('id, amount, academic_year, semester, payment_date, payment_method, receipt_number, student_id')
      .eq('receipt_number', receiptNumber)
      .single();

    if (!receipt) {
      res.json({ result: { valid: false, receipt_number: receiptNumber } });
      return;
    }

    // Fetch student and receipt separately to avoid Supabase type issues
    const { data: student } = await supabase
      .from('students')
      .select('full_name, index_number, department, level')
      .eq('id', receipt.student_id)
      .single();

    const { data: receiptRecord } = await supabase
      .from('receipts')
      .select('verification_hash')
      .eq('payment_id', receipt.id)
      .single();

    res.json({
      result: {
        valid: true,
        receipt_number: receipt.receipt_number,
        student_name: student?.full_name,
        index_number: student?.index_number,
        department: student?.department,
        level: student?.level,
        amount: receipt.amount,
        academic_year: receipt.academic_year,
        semester: receipt.semester,
        payment_date: receipt.payment_date,
        payment_method: receipt.payment_method,
        verification_hash: receiptRecord?.verification_hash,
      },
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
