import { Router, Request, Response } from 'express';
import db from '../db/index.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { calculateStudentDues, createPayment, getDashboardStats, getRequiredDuesAmount } from '../services/payments.js';
import { hashPassword } from '../services/auth.js';
import { generateReceiptHTML } from '../services/receipt.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// GET /admin/dashboard
router.get('/dashboard', (_req: AuthRequest, res: Response) => {
  try {
    const stats = getDashboardStats();
    res.json({ stats });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// GET /admin/students
router.get('/students', (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 200);
    const offset = (page - 1) * limit;

    let students: any[];
    let total: number;

    if (q) {
      const like = `%${q}%`;
      students = db.prepare(
        `SELECT s.id, s.full_name, s.index_number, s.department, s.level, s.phone_number, s.created_at, s.updated_at, u.email
         FROM students s
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.full_name LIKE ? OR s.index_number LIKE ? OR s.department LIKE ?
         ORDER BY s.id DESC LIMIT ? OFFSET ?`
      ).all(like, like, like, limit, offset);

      total = (db.prepare(
        "SELECT COUNT(*) as c FROM students WHERE full_name LIKE ? OR index_number LIKE ? OR department LIKE ?"
      ).get(like, like, like) as { c: number }).c;
    } else {
      students = db.prepare(
        `SELECT s.id, s.full_name, s.index_number, s.department, s.level, s.phone_number, s.created_at, s.updated_at, u.email
         FROM students s
         LEFT JOIN users u ON s.user_id = u.id
         ORDER BY s.id DESC LIMIT ? OFFSET ?`
      ).all(limit, offset);

      total = (db.prepare("SELECT COUNT(*) as c FROM students").get() as { c: number }).c;
    }

    res.json({ students, total, page, total_pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Students list error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /admin/payments
router.get('/payments', (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 200);
    const offset = (page - 1) * limit;

    const payments = db.prepare(
      `SELECT p.*, s.full_name, s.index_number
       FROM payments p
       JOIN students s ON s.id = p.student_id
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(limit, offset);

    const total = (db.prepare("SELECT COUNT(*) as c FROM payments").get() as { c: number }).c;

    const byMethod = db.prepare(
      `SELECT payment_method as method, COUNT(*) as count, SUM(amount) as amount
       FROM payments GROUP BY payment_method`
    ).all();

    res.json({ payments, total, page, total_pages: Math.ceil(total / limit), by_method: byMethod });
  } catch (err) {
    console.error('Payments list error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /admin/student_dues
router.get('/student_dues', (req: AuthRequest, res: Response) => {
  try {
    const studentId = parseInt(req.query.id as string);
    if (!studentId) { res.status(400).json({ error: 'Student id required' }); return; }

    const currentYear = new Date().getFullYear().toString();
    const dues = calculateStudentDues(studentId, currentYear);

    const student = db.prepare(
      `SELECT s.id, s.full_name, s.index_number, s.department, s.level, s.phone_number, s.created_at, u.email
       FROM students s LEFT JOIN users u ON s.user_id = u.id WHERE s.id = ?`
    ).get(studentId) as any;

    if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

    const payments = db.prepare(
      "SELECT id as payment_id, amount, academic_year, semester, payment_date, payment_method, receipt_number, created_at FROM payments WHERE student_id = ? ORDER BY id DESC LIMIT 100"
    ).all(studentId);

    const semester = dues.academic_year === currentYear ? (new Date().getMonth() < 6 ? 'First' : 'Second') : 'First';

    res.json({ dues: { ...dues, student, payments, semester, status: dues.balance <= 0 ? 'paid' : dues.paid > 0 ? 'partially_paid' : 'unpaid', total_due: dues.required, total_paid: dues.paid, outstanding: dues.balance } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student dues' });
  }
});

// POST /admin/payments
router.post('/payments', (req: AuthRequest, res: Response) => {
  try {
    const { student_id, amount, academic_year, semester, payment_method, payment_date, phone_number, transaction_id, account_number } = req.body;

    if (!student_id || !amount || amount <= 0 || !academic_year || !semester || !payment_method || !payment_date) {
      res.status(400).json({ error: 'student_id, amount, academic_year, semester, payment_method, payment_date are required' });
      return;
    }

    const student = db.prepare("SELECT id, full_name, index_number FROM students WHERE id = ?").get(student_id) as any;
    if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

    const result = createPayment({ student_id, amount, academic_year, semester, payment_method, payment_date, recorded_by: req.user!.id, phone_number, transaction_id, account_number });

    res.json({ payment: { payment_id: result.id, receipt_number: result.receipt_number, amount, academic_year, semester, payment_method, payment_date }, receipt_url: `/receipts/${result.receipt_number}.pdf` });
  } catch (err: any) {
    console.error('Create payment error:', err);
    const status = err.message?.includes('already paid') || err.message?.includes('exceeds') ? 400 : 500;
    res.status(status).json({ error: err.message || 'Failed to create payment' });
  }
});

// DELETE /admin/payments/:id
router.delete('/payments/:id', (req: AuthRequest, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    if (!paymentId) { res.status(400).json({ error: 'Payment id required' }); return; }

    const payment = db.prepare("SELECT id, receipt_number FROM payments WHERE id = ?").get(paymentId) as any;
    if (!payment) { res.status(404).json({ error: 'Payment not found' }); return; }

    db.prepare("DELETE FROM receipts WHERE payment_id = ?").run(paymentId);
    db.prepare("DELETE FROM payments WHERE id = ?").run(paymentId);

    res.json({ ok: true, deleted: paymentId });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// GET /admin/payments/:id/receipt — get receipt data as JSON
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
       WHERE p.id = ?`
    ).get(paymentId) as any;

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

// GET /admin/reports
router.get('/reports', (req: AuthRequest, res: Response) => {
  try {
    const type = req.query.type as string;
    const from = req.query.from as string || '';
    const to = req.query.to as string || '';
    const currentYear = new Date().getFullYear().toString();

    if (type === 'compliance') {
      const students = db.prepare(
        `SELECT s.id, s.full_name, s.index_number, s.department, s.level,
                COALESCE(SUM(p.amount), 0) as total_paid
         FROM students s
         LEFT JOIN payments p ON p.student_id = s.id AND p.academic_year = ?
         GROUP BY s.id ORDER BY s.full_name`
      ).all(currentYear);

      const required = getRequiredDuesAmount();
      const rows = (students as any[]).map(s => ({
        ...s,
        required,
        balance: Math.max(0, required - s.total_paid),
        status: s.total_paid >= required ? 'Paid' : 'Outstanding',
      }));

      res.json({ rows });
    } else if (type === 'defaulters') {
      const required = getRequiredDuesAmount();
      const rows = db.prepare(
        `SELECT s.id, s.full_name, s.index_number, s.department, s.level,
                COALESCE(SUM(p.amount), 0) as total_paid,
                ? - COALESCE(SUM(p.amount), 0) as balance
         FROM students s
         LEFT JOIN payments p ON p.student_id = s.id AND p.academic_year = ?
         GROUP BY s.id
         HAVING total_paid < ?
         ORDER BY balance DESC`
      ).all(required, currentYear, required);

      res.json({ rows });
    } else if (type === 'financial') {
      let query = "SELECT payment_method, COUNT(*) as count, SUM(amount) as total FROM payments";
      const conditions: string[] = [];
      const params: any[] = [];

      if (from) { conditions.push("payment_date >= ?"); params.push(from); }
      if (to) { conditions.push("payment_date <= ?"); params.push(to); }
      if (conditions.length) query += " WHERE " + conditions.join(" AND ");
      query += " GROUP BY payment_method";

      const rows = db.prepare(query).all(...params);
      res.json({ rows });
    } else {
      res.status(400).json({ error: 'Invalid report type. Use: compliance, defaulters, financial' });
    }
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /admin/users
router.get('/users', (_req: AuthRequest, res: Response) => {
  try {
    const users = db.prepare("SELECT id, email, role, status, created_at FROM users ORDER BY id").all();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /admin/users
router.post('/users', (req: AuthRequest, res: Response) => {
  try {
    const { email, password, role, full_name, index_number, department, level } = req.body;
    if (!email || !password || !role) {
      res.status(400).json({ error: 'email, password, role are required' });
      return;
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) { res.status(409).json({ error: 'Email already exists' }); return; }

    const info = db.prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)").run(email, hashPassword(password), role);
    const userId = info.lastInsertRowid as number;

    if (role === 'student' && index_number && full_name) {
      db.prepare("INSERT INTO students (user_id, index_number, full_name, department, level) VALUES (?, ?, ?, ?, ?)").run(
        userId,
        index_number,
        full_name,
        department || 'Computer Science',
        level || '100'
      );
    }

    res.json({ user: { id: userId, email, role } });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /admin/settings
router.get('/settings', (_req: AuthRequest, res: Response) => {
  try {
    const rows = db.prepare("SELECT setting_key, setting_value FROM system_settings").all() as { setting_key: string; setting_value: string }[];
    const settings: Record<string, string> = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /admin/settings
router.put('/settings', (req: AuthRequest, res: Response) => {
  try {
    const { annual_dues_amount } = req.body;
    if (annual_dues_amount !== undefined) {
      const val = parseFloat(annual_dues_amount);
      if (isNaN(val) || val <= 0) {
        res.status(400).json({ error: 'annual_dues_amount must be a positive number' });
        return;
      }
      db.prepare(
        "INSERT INTO system_settings (setting_key, setting_value) VALUES ('annual_dues_amount', ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?"
      ).run(String(val), String(val));
    }
    const rows = db.prepare("SELECT setting_key, setting_value FROM system_settings").all() as { setting_key: string; setting_value: string }[];
    const settings: Record<string, string> = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;