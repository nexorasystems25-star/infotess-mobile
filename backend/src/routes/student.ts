import { Router, Response } from 'express';
import { supabase } from '../db/index.js';
import { authenticate, requireStudent, AuthRequest } from '../middleware/auth.js';
import { calculateStudentDues, getRequiredDuesAmount } from '../services/payments.js';
import { notifyAdminProofSubmitted, notifyStudentProofReceived } from '../services/email.js';

const router = Router();

// All student routes require authentication + student role
router.use(authenticate, requireStudent);

// GET /student/profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('id, index_number, full_name, department, level, phone_number, users(email)')
      .eq('id', req.user!.id)
      .single();

    if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

    const user = student.users as any;
    res.json({ student: { id: student.id, index_number: student.index_number, full_name: student.full_name, department: student.department, level: student.level, phone_number: student.phone_number, email: user?.email } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /student/dues
router.get('/dues', async (req: AuthRequest, res: Response) => {
  try {
    const currentYear = new Date().getFullYear().toString();
    const dues = await calculateStudentDues(req.user!.id, currentYear);

    const { data: student } = await supabase
      .from('students')
      .select('id, index_number, full_name, department, level, phone_number, users(email)')
      .eq('id', req.user!.id)
      .single();

    const user = student?.users as any;
    const studentInfo = student
      ? { id: student.id, index_number: student.index_number, full_name: student.full_name, department: student.department, level: student.level, phone_number: student.phone_number, email: user?.email }
      : null;

    const { data: payments } = await supabase
      .from('payments')
      .select('id, amount, academic_year, semester, payment_date, payment_method, receipt_number, created_at')
      .eq('student_id', req.user!.id)
      .order('id', { ascending: false })
      .limit(100);

    res.json({
      dues: {
        ...dues,
        student: studentInfo,
        payments: payments || [],
        semester: 'All',
        status: dues.balance <= 0 ? 'paid' : dues.paid > 0 ? 'partially_paid' : 'unpaid',
        total_due: dues.required,
        total_paid: dues.paid,
        outstanding: dues.balance,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dues' });
  }
});

// GET /student/payments
router.get('/payments', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 100, 1), 200);
    const { data: payments } = await supabase
      .from('payments')
      .select('id, amount, academic_year, semester, payment_date, payment_method, receipt_number, created_at')
      .eq('student_id', req.user!.id)
      .order('id', { ascending: false })
      .limit(limit);

    res.json({ payments: payments || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /student/notifications
router.get('/notifications', async (req: AuthRequest, res: Response) => {
  try {
    // Get user_id from student record
    const { data: student } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', req.user!.id)
      .single();

    const userId = student?.user_id || req.user!.id;

    const { data: notifications } = await supabase
      .from('notifications')
      .select('id, title, message, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    res.json({ notifications: (notifications || []).map(n => ({ ...n, is_read: !!n.is_read })) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /student/payments/:id/receipt — get receipt data as JSON
router.get('/payments/:id/receipt', async (req: AuthRequest, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    if (!paymentId) { res.status(400).json({ error: 'Payment id required' }); return; }

    const { data: payment } = await supabase
      .from('payments')
      .select('id, student_id, amount, academic_year, semester, payment_method, payment_date, receipt_number')
      .eq('id', paymentId)
      .eq('student_id', req.user!.id)
      .single();

    if (!payment) { res.status(404).json({ error: 'Payment not found' }); return; }

    const { data: student } = await supabase
      .from('students')
      .select('full_name, index_number, department, level, phone_number')
      .eq('id', payment.student_id)
      .single();

    const { data: receiptRecord } = await supabase
      .from('receipts')
      .select('verification_hash')
      .eq('payment_id', payment.id)
      .single();

    const required = await getRequiredDuesAmount();
    const { data: paidPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('student_id', payment.student_id)
      .eq('academic_year', payment.academic_year);

    const totalPaid = (paidPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

    res.json({
      receipt: {
        receipt_number: payment.receipt_number,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        amount: payment.amount,
        academic_year: payment.academic_year,
        semester: payment.semester,
        full_name: student?.full_name,
        index_number: student?.index_number,
        department: student?.department,
        level: student?.level,
        phone_number: student?.phone_number,
        verification_hash: receiptRecord?.verification_hash,
        total_paid: totalPaid,
        required,
      },
    });
  } catch (err) {
    console.error('Receipt fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// POST /student/proofs — submit a payment proof
router.post('/proofs', async (req: AuthRequest, res: Response) => {
  try {
    const { payment_method, amount, academic_year, semester, reference_number, sender_phone, notes, proof_image_url } = req.body;

    if (!payment_method || !amount || amount <= 0 || !academic_year || !semester) {
      res.status(400).json({ error: 'payment_method, amount, academic_year, semester are required' });
      return;
    }

    const { data: settings } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['current_academic_year', 'current_semester']);

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach(s => { settingsMap[s.setting_key] = s.setting_value; });

    if (academic_year !== settingsMap.current_academic_year) {
      res.status(400).json({ error: `Academic year must be ${settingsMap.current_academic_year}` });
      return;
    }

    const { data: proof, error } = await supabase
      .from('payment_proofs')
      .insert({
        student_id: req.user!.id,
        payment_method,
        amount: parseFloat(amount),
        academic_year,
        semester,
        reference_number: reference_number || null,
        sender_phone: sender_phone || null,
        notes: notes || null,
        proof_image_url: proof_image_url || null,
        status: 'pending',
      })
      .select('id, payment_method, amount, academic_year, semester, reference_number, sender_phone, notes, proof_image_url, status, created_at')
      .single();

    if (error) throw error;

    res.json({ proof });

    // Send emails (fire-and-forget, don't block response)
    (async () => {
      try {
        const { data: student } = await supabase
          .from('students')
          .select('full_name, index_number, users(email)')
          .eq('id', req.user!.id)
          .single();
        const user = student?.users as any;
        const studentEmail = user?.email || '';
        const studentName = student?.full_name || 'Student';
        const indexNumber = student?.index_number || '';
        const amt = parseFloat(amount);

        notifyAdminProofSubmitted({
          studentName, indexNumber, amount: amt,
          method: payment_method, academicYear: academic_year, semester,
        });

        if (studentEmail) {
          notifyStudentProofReceived({
            studentEmail, studentName, amount: amt,
            method: payment_method, academicYear: academic_year, semester,
          });
        }
      } catch (e) {
        console.error('Email notification error:', e);
      }
    })();
  } catch (err: any) {
    console.error('Submit proof error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit proof' });
  }
});

// GET /student/settings — current academic year & semester
router.get('/settings', async (_req: AuthRequest, res: Response) => {
  try {
    const { data: rows } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['current_academic_year', 'current_semester', 'annual_dues_amount']);

    const settings: Record<string, string> = {};
    (rows || []).forEach(r => { settings[r.setting_key] = r.setting_value; });

    res.json({
      current_academic_year: settings.current_academic_year || new Date().getFullYear().toString(),
      current_semester: settings.current_semester || '1',
      annual_dues_amount: settings.annual_dues_amount || '80',
    });
  } catch (err) {
    console.error('Fetch settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// GET /student/proofs — list own proofs
router.get('/proofs', async (req: AuthRequest, res: Response) => {
  try {
    const { data: proofs, error } = await supabase
      .from('payment_proofs')
      .select('id, payment_method, amount, academic_year, semester, reference_number, sender_phone, notes, proof_image_url, status, review_notes, reviewed_at, created_at')
      .eq('student_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ proofs: proofs || [] });
  } catch (err) {
    console.error('List proofs error:', err);
    res.status(500).json({ error: 'Failed to fetch proofs' });
  }
});

export default router;
