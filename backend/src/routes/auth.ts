import { Router, Request, Response } from 'express';
import db from '../db/index.js';
import { generateTokens, verifyPassword, verifyRefreshToken } from '../services/auth.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /auth/login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { index_number, email, password, role } = req.body;
    const isStudent = role === 'student';

    if (isStudent) {
      if (!index_number || !password) {
        res.status(400).json({ error: 'index_number and password required' });
        return;
      }

      const student = db.prepare(
        `SELECT s.id, s.index_number, s.full_name, s.department, s.level, s.phone_number, u.email, u.password_hash
         FROM students s
         JOIN users u ON s.user_id = u.id
         WHERE s.index_number = ? AND u.role = 'student' AND u.status = 'active'`
      ).get(index_number) as any;

      if (!student || !verifyPassword(password, student.password_hash)) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const tokens = generateTokens({
        id: student.id,
        role: 'student',
        type: 'student',
        name: student.full_name,
        email: student.email,
        index_number: student.index_number,
      });

      res.json({
        ok: true,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: { type: 'student', student_id: student.id, full_name: student.full_name, index_number: student.index_number, department: student.department, level: student.level, email: student.email },
      });
    } else {
      // Admin login
      if (!email || !password) {
        res.status(400).json({ error: 'email and password required' });
        return;
      }

      const admin = db.prepare(
        "SELECT id, email, role, password_hash FROM users WHERE email = ? AND role IN ('admin', 'super_admin') AND status = 'active'"
      ).get(email) as any;

      if (!admin || !verifyPassword(password, admin.password_hash)) {
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
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.type === 'student') {
      const student = db.prepare(
        `SELECT s.id, s.index_number, s.full_name, s.department, s.level, s.phone_number, u.email
         FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?`
      ).get(req.user.id) as any;

      res.json({
        ok: true,
        user: { type: 'student', student_id: student.id, full_name: student.full_name, index_number: student.index_number, department: student.department, level: student.level, email: student.email },
      });
    } else {
      const admin = db.prepare("SELECT id, email, role FROM users WHERE id = ?").get(req.user!.id) as any;
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
  // In production, this would send an email. For dev, just return success.
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: 'Email required' }); return; }
  res.json({ ok: true, message: 'If the email exists, a reset link has been sent.' });
});

// POST /auth/refresh
router.post('/refresh', (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) { res.status(400).json({ error: 'refresh_token required' }); return; }

    const decoded = verifyRefreshToken(refresh_token);
    const user = db.prepare("SELECT id, email, role FROM users WHERE id = ?").get(decoded.id) as any;
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }

    const student = db.prepare("SELECT s.id, s.index_number, s.full_name, s.department, s.level FROM students s WHERE s.user_id = ?").get(user.id) as any;

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