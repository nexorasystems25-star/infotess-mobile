import { Router, Request, Response } from 'express';
import { supabase } from '../db/index.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { calculateStudentDues, createPayment, getDashboardStats, getRequiredDuesAmount } from '../services/payments.js';
import { hashPassword } from '../services/auth.js';
import { notifyStudentProofApproved, notifyStudentProofRejected, notifyStudentRegistered } from '../services/email.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// GET /admin/dashboard
router.get('/dashboard', async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await getDashboardStats();
    res.json({ stats });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// GET /admin/students
router.get('/students', async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 200);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('students')
      .select('id, full_name, index_number, department, level, phone_number, created_at, updated_at, users(email)', { count: 'exact' })
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.or(`full_name.ilike.%${q}%,index_number.ilike.%${q}%,department.ilike.%${q}%`);
    }

    const { data: students, count, error } = await query;
    if (error) throw error;

    const total = count || 0;
    res.json({ students: students || [], total, page, total_pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Students list error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /admin/payments
router.get('/payments', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 200);
    const offset = (page - 1) * limit;

    const { data: payments, count, error } = await supabase
      .from('payments')
      .select('*, students(full_name, index_number)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Payment method breakdown
    const { data: allPayments } = await supabase.from('payments').select('payment_method, amount');
    const byMethodMap: Record<string, { method: string; count: number; amount: number }> = {};
    (allPayments || []).forEach(p => {
      if (!byMethodMap[p.payment_method]) {
        byMethodMap[p.payment_method] = { method: p.payment_method, count: 0, amount: 0 };
      }
      byMethodMap[p.payment_method].count++;
      byMethodMap[p.payment_method].amount += Number(p.amount);
    });

    res.json({ payments: payments || [], total: count || 0, page, total_pages: Math.ceil((count || 0) / limit), by_method: Object.values(byMethodMap) });
  } catch (err) {
    console.error('Payments list error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /admin/student_dues
router.get('/student_dues', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = parseInt(req.query.id as string);
    if (!studentId) { res.status(400).json({ error: 'Student id required' }); return; }

    const currentYear = new Date().getFullYear().toString();
    const dues = await calculateStudentDues(studentId, currentYear);

    const { data: student } = await supabase
      .from('students')
      .select('id, full_name, index_number, department, level, phone_number, created_at, users(email)')
      .eq('id', studentId)
      .single();

    if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select('id, amount, academic_year, semester, payment_date, payment_method, receipt_number, created_at')
      .eq('student_id', studentId)
      .order('id', { ascending: false })
      .limit(100);

    const semester = dues.academic_year === currentYear ? (new Date().getMonth() < 6 ? 'First' : 'Second') : 'First';

    res.json({ dues: { ...dues, student, payments: payments || [], semester, status: dues.balance <= 0 ? 'paid' : dues.paid > 0 ? 'partially_paid' : 'unpaid', total_due: dues.required, total_paid: dues.paid, outstanding: dues.balance } });
  } catch (err) {
    console.error('Student dues error:', err);
    res.status(500).json({ error: 'Failed to fetch student dues' });
  }
});

// POST /admin/payments
router.post('/payments', async (req: AuthRequest, res: Response) => {
  try {
    const { student_id, amount, academic_year, semester, payment_method, payment_date, phone_number, transaction_id, account_number } = req.body;

    if (!student_id || !amount || amount <= 0 || !academic_year || !semester || !payment_method || !payment_date) {
      res.status(400).json({ error: 'student_id, amount, academic_year, semester, payment_method, payment_date are required' });
      return;
    }

    const { data: student } = await supabase
      .from('students')
      .select('id, full_name, index_number')
      .eq('id', student_id)
      .single();

    if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

    const result = await createPayment({ student_id, amount, academic_year, semester, payment_method, payment_date, recorded_by: req.user!.id, phone_number, transaction_id, account_number });

    res.json({ payment: { payment_id: result.id, receipt_number: result.receipt_number, amount, academic_year, semester, payment_method, payment_date }, receipt_url: `/receipts/${result.receipt_number}.pdf` });
  } catch (err: any) {
    console.error('Create payment error:', err);
    const status = err.message?.includes('already paid') || err.message?.includes('exceeds') ? 400 : 500;
    res.status(status).json({ error: err.message || 'Failed to create payment' });
  }
});

// DELETE /admin/payments/:id
router.delete('/payments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    if (!paymentId) { res.status(400).json({ error: 'Payment id required' }); return; }

    const { data: payment } = await supabase.from('payments').select('id').eq('id', paymentId).single();
    if (!payment) { res.status(404).json({ error: 'Payment not found' }); return; }

    await supabase.from('receipts').delete().eq('payment_id', paymentId);
    await supabase.from('payments').delete().eq('id', paymentId);

    res.json({ ok: true, deleted: paymentId });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// GET /admin/payments/:id/receipt — get receipt data as JSON
router.get('/payments/:id/receipt', async (req: AuthRequest, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    if (!paymentId) { res.status(400).json({ error: 'Payment id required' }); return; }

    const { data: payment } = await supabase
      .from('payments')
      .select('id, student_id, amount, academic_year, semester, payment_method, payment_date, receipt_number')
      .eq('id', paymentId)
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

// GET /admin/reports
router.get('/reports', async (req: AuthRequest, res: Response) => {
  try {
    const type = req.query.type as string;
    const from = req.query.from as string || '';
    const to = req.query.to as string || '';
    const currentYear = new Date().getFullYear().toString();

    if (type === 'compliance') {
      const required = await getRequiredDuesAmount();
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, index_number, department, level')
        .order('full_name');

      const { data: yearPayments } = await supabase
        .from('payments')
        .select('student_id, amount')
        .eq('academic_year', currentYear);

      const paidMap: Record<number, number> = {};
      (yearPayments || []).forEach(p => {
        paidMap[p.student_id] = (paidMap[p.student_id] || 0) + Number(p.amount);
      });

      const rows = (students || []).map(s => ({
        ...s,
        total_paid: paidMap[s.id] || 0,
        required,
        balance: Math.max(0, required - (paidMap[s.id] || 0)),
        status: (paidMap[s.id] || 0) >= required ? 'Paid' : 'Outstanding',
      }));

      res.json({ rows });
    } else if (type === 'defaulters') {
      const required = await getRequiredDuesAmount();
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, index_number, department, level')
        .order('full_name');

      const { data: yearPayments } = await supabase
        .from('payments')
        .select('student_id, amount')
        .eq('academic_year', currentYear);

      const paidMap: Record<number, number> = {};
      (yearPayments || []).forEach(p => {
        paidMap[p.student_id] = (paidMap[p.student_id] || 0) + Number(p.amount);
      });

      const rows = (students || [])
        .map(s => ({
          ...s,
          total_paid: paidMap[s.id] || 0,
          balance: required - (paidMap[s.id] || 0),
        }))
        .filter(s => s.total_paid < required)
        .sort((a, b) => b.balance - a.balance);

      res.json({ rows });
    } else if (type === 'financial') {
      let query = supabase.from('payments').select('payment_method, amount, payment_date');
      if (from) query = query.gte('payment_date', from);
      if (to) query = query.lte('payment_date', to);

      const { data: filteredPayments } = await query;

      const methodMap: Record<string, { payment_method: string; count: number; total: number }> = {};
      (filteredPayments || []).forEach(p => {
        if (!methodMap[p.payment_method]) {
          methodMap[p.payment_method] = { payment_method: p.payment_method, count: 0, total: 0 };
        }
        methodMap[p.payment_method].count++;
        methodMap[p.payment_method].total += Number(p.amount);
      });

      res.json({ rows: Object.values(methodMap) });
    } else {
      res.status(400).json({ error: 'Invalid report type. Use: compliance, defaulters, financial' });
    }
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /admin/users
router.get('/users', async (_req: AuthRequest, res: Response) => {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, email, role, status, created_at')
      .order('id');
    res.json({ users: users || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /admin/users
router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, role, full_name, index_number, department, level } = req.body;
    if (!email || !password || !role) {
      res.status(400).json({ error: 'email, password, role are required' });
      return;
    }

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) { res.status(409).json({ error: 'Email already exists' }); return; }

    const { data: newUser, error: userErr } = await supabase
      .from('users')
      .insert({ email, password_hash: hashPassword(password), role })
      .select('id')
      .single();

    if (userErr) throw userErr;

    if (role === 'student' && index_number && full_name) {
      await supabase.from('students').insert({
        user_id: newUser.id,
        index_number,
        full_name,
        department: department || 'Computer Science',
        level: level || '100',
      });
    }

    res.json({ user: { id: newUser.id, email, role } });

    // Send welcome email to new student (fire-and-forget)
    if (role === 'student' && index_number && full_name) {
      (async () => {
        try {
          notifyStudentRegistered({
            studentEmail: email,
            studentName: full_name,
            indexNumber: index_number,
            department: department || 'Computer Science',
            level: level || '100',
            password,
          });
        } catch (e) { console.error('Registration email error:', e); }
      })();
    }
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /admin/settings
router.get('/settings', async (_req: AuthRequest, res: Response) => {
  try {
    const { data: rows } = await supabase.from('system_settings').select('setting_key, setting_value');
    const settings: Record<string, string> = {};
    (rows || []).forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /admin/settings
router.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const { annual_dues_amount, current_academic_year, current_semester, org_member_since } = req.body;
    console.log('PUT /admin/settings body:', JSON.stringify(req.body));

    const upsertSetting = async (key: string, value: string) => {
      // Delete any existing rows for this key, then insert fresh
      const { error: delErr } = await supabase
        .from('system_settings')
        .delete()
        .eq('setting_key', key);

      if (delErr) {
        console.error(`Settings delete error for ${key}:`, delErr.message, delErr.details, delErr.hint);
        return;
      }

      const { data: insData, error: insErr } = await supabase
        .from('system_settings')
        .insert({ setting_key: key, setting_value: value })
        .select();

      if (insErr) {
        console.error(`Settings insert error for ${key}:`, insErr.message, insErr.details, insErr.hint);
      } else {
        console.log(`Settings saved: ${key} = "${value}"`, JSON.stringify(insData));
      }
    };

    if (annual_dues_amount !== undefined) {
      const val = parseFloat(annual_dues_amount);
      if (isNaN(val) || val <= 0) {
        res.status(400).json({ error: 'annual_dues_amount must be a positive number' });
        return;
      }
      await upsertSetting('annual_dues_amount', String(val));
    }

    if (current_academic_year !== undefined) {
      await upsertSetting('current_academic_year', current_academic_year);
    }

    if (current_semester !== undefined) {
      await upsertSetting('current_semester', current_semester);
    }

    if (org_member_since !== undefined) {
      await upsertSetting('org_member_since', org_member_since);
    }

    // Read back all settings
    const { data: rows, error: readErr } = await supabase.from('system_settings').select('setting_key, setting_value');
    if (readErr) console.error('Settings read-back error:', readErr.message);
    const settings: Record<string, string> = {};
    (rows || []).forEach(r => { settings[r.setting_key] = r.setting_value; });
    console.log('Returning settings:', JSON.stringify(settings));
    res.json({ settings });
  } catch (err: any) {
    console.error('PUT /admin/settings error:', err?.message || err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ─── Payment Proofs ────────────────────────────────────────────────────────

// GET /admin/proofs — list all proofs (optionally filter by status)
router.get('/proofs', async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 200);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('payment_proofs')
      .select('*, students(full_name, index_number, department, level)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: proofs, count, error } = await query;
    if (error) throw error;

    // Count pending
    const { count: pendingCount } = await supabase
      .from('payment_proofs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    res.json({
      proofs: proofs || [],
      total: count || 0,
      pending_count: pendingCount || 0,
      page,
      total_pages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('List proofs error:', err);
    res.status(500).json({ error: 'Failed to fetch proofs' });
  }
});

// GET /admin/proofs/:id — single proof detail
router.get('/proofs/:id', async (req: AuthRequest, res: Response) => {
  try {
    const proofId = parseInt(req.params.id);
    if (!proofId) { res.status(400).json({ error: 'Proof id required' }); return; }

    const { data: proof, error } = await supabase
      .from('payment_proofs')
      .select('*, students(full_name, index_number, department, level)')
      .eq('id', proofId)
      .single();

    if (error || !proof) { res.status(404).json({ error: 'Proof not found' }); return; }
    res.json({ proof });
  } catch (err) {
    console.error('Get proof error:', err);
    res.status(500).json({ error: 'Failed to fetch proof' });
  }
});

// POST /admin/proofs/:id/approve — approve proof and create payment
router.post('/proofs/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const proofId = parseInt(req.params.id);
    if (!proofId) { res.status(400).json({ error: 'Proof id required' }); return; }

    const { data: proof, error: fetchErr } = await supabase
      .from('payment_proofs')
      .select('*, students(full_name, index_number, users(email))')
      .eq('id', proofId)
      .single();

    if (fetchErr || !proof) { res.status(404).json({ error: 'Proof not found' }); return; }
    if (proof.status !== 'pending') {
      res.status(400).json({ error: `Proof already ${proof.status}` });
      return;
    }

    const { review_notes } = req.body || {};
    const paymentDate = new Date(proof.created_at).toISOString().split('T')[0];

    // Create the actual payment
    const result = await createPayment({
      student_id: proof.student_id,
      amount: proof.amount,
      academic_year: proof.academic_year,
      semester: proof.semester,
      payment_method: proof.payment_method,
      payment_date: paymentDate,
      recorded_by: req.user!.id,
      phone_number: proof.sender_phone || undefined,
      transaction_id: proof.reference_number || undefined,
    });

    // Mark proof as approved
    const { error: updateErr } = await supabase
      .from('payment_proofs')
      .update({
        status: 'approved',
        reviewed_by: req.user!.id,
        review_notes: review_notes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', proofId);

    if (updateErr) throw updateErr;

    // Notify student
    await supabase.from('notifications').insert({
      user_id: proof.student_id,
      title: 'Payment Approved',
      message: `Your payment of GH₵ ${proof.amount} has been approved. Receipt: ${result.receipt_number}`,
    });

    res.json({
      ok: true,
      proof_id: proofId,
      payment: { id: result.id, receipt_number: result.receipt_number, amount: proof.amount },
    });

    // Send email (fire-and-forget)
    (async () => {
      try {
        const student = proof.students as any;
        const studentEmail = student?.users?.email || '';
        if (studentEmail) {
          notifyStudentProofApproved({
            studentEmail,
            studentName: student?.full_name || 'Student',
            amount: proof.amount,
            receiptNumber: result.receipt_number,
            method: proof.payment_method,
            academicYear: proof.academic_year,
            semester: proof.semester,
          });
        }
      } catch (e) { console.error('Email notify error:', e); }
    })();
  } catch (err: any) {
    console.error('Approve proof error:', err);
    const status = err.message?.includes('already paid') || err.message?.includes('exceeds') ? 400 : 500;
    res.status(status).json({ error: err.message || 'Failed to approve proof' });
  }
});

// POST /admin/proofs/:id/reject — reject proof
router.post('/proofs/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const proofId = parseInt(req.params.id);
    if (!proofId) { res.status(400).json({ error: 'Proof id required' }); return; }

    const { data: proof, error: fetchErr } = await supabase
      .from('payment_proofs')
      .select('id, status, student_id, amount, academic_year, semester, payment_method, students(full_name, users(email))')
      .eq('id', proofId)
      .single();

    if (fetchErr || !proof) { res.status(404).json({ error: 'Proof not found' }); return; }
    if (proof.status !== 'pending') {
      res.status(400).json({ error: `Proof already ${proof.status}` });
      return;
    }

    const { review_notes } = req.body || {};

    const { error: updateErr } = await supabase
      .from('payment_proofs')
      .update({
        status: 'rejected',
        reviewed_by: req.user!.id,
        review_notes: review_notes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', proofId);

    if (updateErr) throw updateErr;

    // Notify student
    await supabase.from('notifications').insert({
      user_id: proof.student_id,
      title: 'Payment Rejected',
      message: `Your payment of GH₵ ${proof.amount} was not approved.${review_notes ? ' Reason: ' + review_notes : ''}`,
    });

    res.json({ ok: true, proof_id: proofId, status: 'rejected' });

    // Send email (fire-and-forget)
    (async () => {
      try {
        const student = proof.students as any;
        const studentEmail = student?.users?.email || '';
        if (studentEmail) {
          notifyStudentProofRejected({
            studentEmail,
            studentName: student?.full_name || 'Student',
            amount: proof.amount,
            reason: review_notes || undefined,
            academicYear: proof.academic_year,
            semester: proof.semester,
          });
        }
      } catch (e) { console.error('Email notify error:', e); }
    })();
  } catch (err: any) {
    console.error('Reject proof error:', err);
    res.status(500).json({ error: err.message || 'Failed to reject proof' });
  }
});

export default router;
