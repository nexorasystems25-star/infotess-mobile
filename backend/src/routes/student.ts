import { Router, Response } from 'express';
import db from '../db/index.js';
import { authenticate, requireStudent, AuthRequest } from '../middleware/auth.js';
import { calculateStudentDues, getRequiredDuesAmount } from '../services/payments.js';
import { generateReceiptHTML } from '../services/receipt.js';

const router = Router();

// All student routes require authentication + student role
router.use(authenticate, requireStudent);

// GET /student/profile
router.get('/profile', (req: AuthRequest, res: Response) => {
  try {
    const student = db.prepare(
      `SELECT s.id, s.index_number, s.full_name, s.department, s.level, s.phone_number, u.email
       FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?`
    ).get(req.user!.id) as any;

    if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

    res.json({ student: { id: student.id, index_number: student.index_number, full_name: student.full_name, department: student.department, level: student.level, phone_number: student.phone_number, email: student.email } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /student/dues
router.get('/dues', (req: AuthRequest, res: Response) => {
  try {
    const currentYear = new Date().getFullYear().toString();
    const dues = calculateStudentDues(req.user!.id, currentYear);
    res.json({ dues: { ...dues, semester: 'All' } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dues' });
  }
});

// GET /student/payments
router.get('/payments', (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 100, 1), 200);
    const payments = db.prepare(
      `SELECT id as payment_id, amount, academic_year, semester, payment_date, payment_method, receipt_number, created_at
       FROM payments WHERE student_id = ? ORDER BY id DESC LIMIT ?`
    ).all(req.user!.id, limit);

    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /student/notifications
router.get('/notifications', (req: AuthRequest, res: Response) => {
  try {
    const student = db.prepare("SELECT user_id FROM students WHERE id = ?").get(req.user!.id) as any;
    const userId = student?.user_id || req.user!.id;
    const notifications = db.prepare(
      `SELECT id, title, message, is_read, created_at
       FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
    ).all(userId);

    res.json({ notifications: notifications.map((n: any) => ({ ...n, is_read: !!n.is_read })) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /student/payments/:id/receipt — get receipt data as JSON
router.get('/payments/:id/receipt', (req: AuthRequest, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    if (!paymentId) { res.status(400).json({ error: 'Payment id required' }); return; }

    const payment = db.prepare(
      `SELECT p.id, p.student_id, p.amount, p.academic_year, p.semester, p.payment_method, p.payment_date, p.receipt_number,
              s.full_name, s.index_number, s.department, s.level, s.phone_number,
              r.verification_hash
       FROM payments p
       JOIN students s ON s.id = p.student_id
       LEFT JOIN receipts r ON r.payment_id = p.id
       WHERE p.id = ? AND p.student_id = ?`
    ).get(paymentId, req.user!.id) as any;

    if (!payment) { res.status(404).json({ error: 'Payment not found' }); return; }

    const required = getRequiredDuesAmount();
    const paidRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE student_id = ? AND academic_year = ?").get(payment.student_id, payment.academic_year) as { total: number };

    res.json({
      receipt: {
        receipt_number: payment.receipt_number,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        amount: payment.amount,
        academic_year: payment.academic_year,
        semester: payment.semester,
        full_name: payment.full_name,
        index_number: payment.index_number,
        department: payment.department,
        level: payment.level,
        phone_number: payment.phone_number,
        verification_hash: payment.verification_hash,
        total_paid: paidRow.total,
        required,
      },
    });
  } catch (err) {
    console.error('Receipt fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

export default router;