import { Router, Request, Response } from 'express';
import { supabase } from '../db/index.js';
import { generateTokens, verifyPassword, verifyRefreshToken } from '../services/auth.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { index_number, email, password, role } = req.body;
    const isStudent = role === 'student';

    if (isStudent) {
      if (!index_number || !password) {
        res.status(400).json({ error: 'index_number and password required' });
        return;
      }

      const { data: student, error } = await supabase
        .from('students')
        .select('id, index_number, full_name, department, level, phone_number, user_id, users!inner(email, password_hash, role, status)')
        .eq('index_number', index_number)
        .single();

      if (error || !student) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const user = student.users as any;
      if (user.role !== 'student' || user.status !== 'active' || !verifyPassword(password, user.password_hash)) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const tokens = generateTokens({
        id: student.id,
        role: 'student',
        type: 'student',
        name: student.full_name,
        email: user.email,
        index_number: student.index_number,
      });

      res.json({
        ok: true,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: { type: 'student', student_id: student.id, full_name: student.full_name, index_number: student.index_number, department: student.department, level: student.level, email: user.email },
      });
    } else {
      // Admin login
      if (!email || !password) {
        res.status(400).json({ error: 'email and password required' });
        return;
      }

      const { data: admin, error } = await supabase
        .from('users')
        .select('id, email, role, password_hash')
        .eq('email', email)
        .in('role', ['admin', 'super_admin'])
        .eq('status', 'active')
        .single();

      if (error || !admin || !verifyPassword(password, admin.password_hash)) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const tokens = generateTokens({
        id: admin.id,
        role: admin.role,
        type: 'admin',
        name: email.split('@')[0],
        email: admin.email,
      });

      res.json({
        ok: true,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: { type: 'admin', admin_id: admin.id, name: email.split('@')[0], email: admin.email, role: admin.role },
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.type === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('id, index_number, full_name, department, level, phone_number, users(email)')
        .eq('id', req.user.id)
        .single();

      if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

      const user = student.users as any;
      res.json({
        ok: true,
        user: { type: 'student', student_id: student.id, full_name: student.full_name, index_number: student.index_number, department: student.department, level: student.level, email: user?.email },
      });
    } else {
      const { data: admin } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', req.user!.id)
        .single();

      if (!admin) { res.status(404).json({ error: 'Admin not found' }); return; }

      res.json({
        ok: true,
        user: { type: 'admin', admin_id: admin.id, name: admin.email.split('@')[0], email: admin.email, role: admin.role },
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /auth/logout
router.post('/logout', authenticate, (_req: AuthRequest, res: Response) => {
  res.json({ ok: true });
});

// POST /auth/forgot
router.post('/forgot', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: 'Email required' }); return; }
  res.json({ ok: true, message: 'If the email exists, a reset link has been sent.' });
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) { res.status(400).json({ error: 'refresh_token required' }); return; }

    const decoded = verifyRefreshToken(refresh_token);

    const { data: user } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', decoded.id)
      .single();

    if (!user) { res.status(401).json({ error: 'User not found' }); return; }

    const { data: student } = await supabase
      .from('students')
      .select('id, index_number, full_name, department, level')
      .eq('user_id', user.id)
      .single();

    const tokens = generateTokens({
      id: user.id,
      role: user.role,
      type: student ? 'student' : 'admin',
      name: student?.full_name || user.email.split('@')[0],
      email: user.email,
      index_number: student?.index_number,
    });

    res.json({ ok: true, ...tokens });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
