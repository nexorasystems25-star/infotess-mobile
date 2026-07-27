import { Router, Request, Response } from 'express';
import db from '../db/index.js';

const router = Router();

// GET /verify (public - no auth required)
router.get('/verify', (req: Request, res: Response) => {
  try {
    const receiptNumber = (req.query.q as string || '').trim();
    if (!receiptNumber) {
      res.status(400).json({ error: 'receipt_number (q) is required' });
      return;
    }

    const receipt = db.prepare(
      `SELECT p.id as payment_id, p.amount, p.academic_year, p.semester, p.payment_date, p.payment_method, p.receipt_number,
              s.full_name as student_name, s.index_number, s.department, s.level,
              r.verification_hash
       FROM payments p
       JOIN students s ON s.id = p.student_id
       LEFT JOIN receipts r ON r.payment_id = p.id
       WHERE p.receipt_number = ?`
    ).get(receiptNumber) as any;

    if (!receipt) {
      res.json({ result: { valid: false, receipt_number: receiptNumber } });
      return;
    }

    res.json({
      result: {
        valid: true,
        receipt_number: receipt.receipt_number,
        student_name: receipt.student_name,
        index_number: receipt.index_number,
        department: receipt.department,
        level: receipt.level,
        amount: receipt.amount,
        academic_year: receipt.academic_year,
        semester: receipt.semester,
        payment_date: receipt.payment_date,
        payment_method: receipt.payment_method,
        verification_hash: receipt.verification_hash,
      },
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;